require("dotenv").config();
require("./src/utils/buffer-compat");

const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const User = require("./src/models/User");
const Post = require("./src/models/Post");

const app = express();
const PORT = Number(process.env.PORT) || 5000;
let databaseReady = false;

app.disable("x-powered-by");
app.use(express.json({ limit: "1mb" }));

function authorize(req, res, next) {
  const authorization = req.get("authorization");

  if (!authorization) {
    req.user = undefined;
    return next();
  }

  const [scheme, token, ...extra] = authorization.trim().split(/\s+/);
  if (scheme.toLowerCase() !== "bearer" || !token || extra.length > 0) {
    req.user = undefined;
    return next();
  }

  if (!process.env.TOKEN_SECRET) {
    return next(new Error("TOKEN_SECRET is not configured"));
  }

  jwt.verify(token, process.env.TOKEN_SECRET, (error, payload) => {
    req.user =
      error || !payload || typeof payload !== "object"
        ? undefined
        : payload;
    return next();
  });
}

app.use((req, res, next) => {
  if (!databaseReady) {
    return res.status(503).json({
      error: "Database unavailable",
      message: "Wait for MongoDB to connect, then retry the request.",
    });
  }
  return next();
});

const postRouter = express.Router();
const userRouter = express.Router();
const protectedRouter = express.Router();

require("./src/routes/post")(postRouter);
require("./src/routes/user")(userRouter);
require("./src/protected_routes/post")(protectedRouter);

app.use("/", postRouter);
app.use("/", userRouter);
app.use(authorize);
app.use("/", protectedRouter);

app.use((req, res) => {
  return res.status(404).json({ error: "Route not found" });
});

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  console.error("Unhandled request error:", error);
  const status =
    Number.isInteger(error.status) && error.status >= 400 && error.status < 500
      ? error.status
      : 500;
  return res.status(status).json({
    error:
      status < 500
        ? error.type === "entity.parse.failed"
          ? "Invalid JSON request body"
          : error.message
        : "Internal server error",
  });
});

function start() {
  const server = app.listen(PORT, () => {
    console.log(`Example app listening on port ${PORT}`);
  });

  server.on("error", (error) => {
    console.error("Could not start HTTP server:", error.message);
    process.exitCode = 1;
  });

  if (!process.env.TOKEN_SECRET) {
    console.error("TOKEN_SECRET is not configured. Set it in the .env file.");
  }

  const mongoUri =
    process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/database";

  mongoose.connection.on("disconnected", () => {
    databaseReady = false;
    console.error("MongoDB connection lost.");
  });

  mongoose.connection.on("reconnected", () => {
    databaseReady = true;
    console.log("MongoDB connection restored.");
  });

  mongoose
    .connect(mongoUri)
    .then(() => Promise.all([User.init(), Post.init()]))
    .then(() => {
      databaseReady = true;
      console.log(`Connected to MongoDB (${mongoose.connection.name})`);
    })
    .catch((error) => {
      databaseReady = false;
      console.error("Could not initialize MongoDB:", error.message);
    });
}

start();
