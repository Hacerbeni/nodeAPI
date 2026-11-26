const mongoose = require("mongoose");
const Post = require("../models/Post");

const editableFields = ["title", "content", "author"];

function isValidPostId(id) {
  return mongoose.isValidObjectId(id);
}

function handlePostError(res, error, action) {
  if (error.name === "ValidationError") {
    return res.status(400).json({ error: error.message });
  }

  console.error(`Could not ${action}:`, error);
  return res.status(500).json({ error: `Could not ${action}` });
}

module.exports = {
  async findPosts(req, res) {
    try {
      const posts = await Post.find({});
      return res.status(200).json(posts);
    } catch (error) {
      return handlePostError(res, error, "retrieve posts");
    }
  },

  async createPost(req, res) {
    const body =
      req.body && typeof req.body === "object" && !Array.isArray(req.body)
        ? req.body
        : {};

    try {
      const post = await Post.create({
        title: body.title,
        content: body.content,
        author: body.author,
      });
      return res.status(201).json(post);
    } catch (error) {
      return handlePostError(res, error, "create post");
    }
  },

  async findOnePost(req, res) {
    if (!isValidPostId(req.params.id)) {
      return res.status(400).json({ error: "Invalid post ID" });
    }

    try {
      const post = await Post.findById(req.params.id);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      return res.status(200).json(post);
    } catch (error) {
      return handlePostError(res, error, "retrieve post");
    }
  },

  async findOnePostAndUpdate(req, res) {
    if (!isValidPostId(req.params.id)) {
      return res.status(400).json({ error: "Invalid post ID" });
    }

    const body =
      req.body && typeof req.body === "object" && !Array.isArray(req.body)
        ? req.body
        : {};
    const update = {};

    for (const field of editableFields) {
      if (Object.prototype.hasOwnProperty.call(body, field)) {
        update[field] = body[field];
      }
    }

    if (Object.keys(update).length === 0) {
      return res.status(400).json({
        error: "Provide at least one of: title, content, author",
      });
    }

    try {
      const post = await Post.findByIdAndUpdate(req.params.id, update, {
        new: true,
        runValidators: true,
      });
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      return res.status(200).json(post);
    } catch (error) {
      return handlePostError(res, error, "update post");
    }
  },

  async findOnePostAndDelete(req, res) {
    if (!isValidPostId(req.params.id)) {
      return res.status(400).json({ error: "Invalid post ID" });
    }

    try {
      const post = await Post.findByIdAndDelete(req.params.id);
      if (!post) {
        return res.status(404).json({ error: "Post not found" });
      }
      return res.status(200).json({ message: "Post deleted successfully" });
    } catch (error) {
      return handlePostError(res, error, "delete post");
    }
  },
};
