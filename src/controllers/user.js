require("../utils/buffer-compat");

const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const config = require("../config");
const User = require("../models/User");

const saltRounds = 10;

function duplicateField(error) {
  const fields = error.keyPattern || error.keyValue;
  return fields ? Object.keys(fields)[0] : undefined;
}

function duplicateMessage(field) {
  const messages = {
    email: "Email already exists",
    username: "Username already exists",
    apiKey: "API key already exists",
  };
  return messages[field] || "A unique value already exists";
}

module.exports = {
  async register(req, res) {
    const body =
      req.body && typeof req.body === "object" && !Array.isArray(req.body)
        ? req.body
        : {};

    if (typeof body.password !== "string" || !body.password) {
      return res.status(400).json({ error: "Password is required" });
    }

    try {
      const user = new User({
        firstName: body.firstName,
        lastName: body.lastName,
        username: body.username,
        email: body.email,
        hashedPassword: await bcrypt.hash(body.password, saltRounds),
      });

      await user.save();

      const userResponse = user.toObject();
      delete userResponse.hashedPassword;
      delete userResponse.apiKey;

      return res.status(201).json(userResponse);
    } catch (error) {
      if (error.code === 11000) {
        const field = duplicateField(error);
        return res.status(409).json({
          error: duplicateMessage(field),
          ...(field ? { field } : {}),
        });
      }

      if (error.name === "ValidationError") {
        return res.status(400).json({ error: error.message });
      }

      console.error("Error while registering new account:", error);
      return res.status(500).json({ error: "Could not register account" });
    }
  },

  async login(req, res) {
    const body =
      req.body && typeof req.body === "object" && !Array.isArray(req.body)
        ? req.body
        : {};
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email || typeof body.password !== "string" || !body.password) {
      return res
        .status(400)
        .json({ error: "Email and password are required" });
    }

    try {
      const user = await User.findOne({ email }).select("+hashedPassword");
      if (!user || !user.hashedPassword) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const matches = await bcrypt.compare(body.password, user.hashedPassword);
      if (!matches) {
        return res.status(401).json({ error: "Invalid email or password" });
      }

      const token = jwt.sign(
        {
          email: user.email,
          fullName: user.fullName,
          _id: user._id.toString(),
        },
        config.TOKEN_SECRET
      );

      return res.status(200).json({ token });
    } catch (error) {
      console.error("Error while logging in:", error);
      return res.status(500).json({ error: "Could not log in" });
    }
  },

  async generateAPIKey(req, res) {
    try {
      const user = await User.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ error: "User account not found" });
      }

      user.setAPIKey();
      await user.save();
      return res.status(200).json({ apikey: user.apiKey });
    } catch (error) {
      console.error("Error while generating API key:", error);
      return res.status(500).json({ error: "Could not generate API key" });
    }
  },
};
