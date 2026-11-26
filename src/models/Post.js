const mongoose = require("mongoose");

const PostSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  content: { type: String, required: true, trim: true },
  created_at: { type: Date, default: Date.now },
  author: { type: String, required: true, trim: true },
});

PostSchema.methods.toLocalString = function () {
  return this.created_at.toLocaleString();
};

module.exports = mongoose.model("Post", PostSchema);
