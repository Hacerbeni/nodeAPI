const User = require("../models/User");
const {
  createPost,
  findOnePostAndUpdate,
  findOnePostAndDelete,
} = require("../controllers/post");

const { generateAPIKey } = require("../controllers/user");

function loginRequired(req, res, next) {
  if (!req.user) {
    return res.status(401).json({
      message: "Unauthorized user, Please register a new account or login",
    });
  }
  next();
}

async function apiKeyRequired(req, res, next) {
  const apiKey = req.header("x-api-key");
  if (!apiKey) {
    return res.status(403).json({
      code: 403,
      message: "The x-api-key header is required",
    });
  }

  try {
    const account = await User.findOne({ apiKey }).select("_id");
    if (!account) {
      return res.status(403).json({
        code: 403,
        message: "Invalid API key",
      });
    }
    return next();
  } catch (error) {
    return next(error);
  }
}

module.exports = (router) => {
  router.post("/generateApiKey", loginRequired, generateAPIKey);
  router.post("/posts/create", loginRequired, apiKeyRequired, createPost);
  router.put("/posts/update/:id", loginRequired, findOnePostAndUpdate);
  router.delete("/posts/delete/:id", loginRequired, findOnePostAndDelete);
};
