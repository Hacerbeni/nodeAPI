const crypto = require("crypto");
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50,
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50,
  },
  username: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 50,
  },
  email: {
    type: String,
    unique: true,
    required: true,
    lowercase: true,
    trim: true,
    minlength: 2,
    maxlength: 50,
    match: [/\S+@\S+\.\S+/, "is invalid"],
  },
  apiKey: {
    type: String,
    unique: true,
    sparse: true,
  },
  hashedPassword: {
    type: String,
    required: true,
    select: false,
  },
  created_at: {
    type: Date,
    default: Date.now,
  },
});

UserSchema.virtual("fullName").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

UserSchema.methods.setAPIKey = function () {
  this.apiKey = crypto.randomBytes(32).toString("hex");
};

module.exports = mongoose.model("User", UserSchema);
