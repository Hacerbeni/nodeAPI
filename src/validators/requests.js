const { z } = require("zod");

const registerBody = z.object({
  firstName: z.string().trim().min(2).max(50),
  lastName: z.string().trim().min(2).max(50),
  username: z.string().trim().min(3).max(50),
  email: z.string().trim().toLowerCase().email().max(50),
  password: z.string().min(1),
});

const loginBody = z.object({
  email: z.string().trim().toLowerCase().email().max(50),
  password: z.string().min(1),
});

const createPostBody = z.object({
  title: z.string().trim().min(1),
  content: z.string().trim().min(1),
  author: z.string().trim().min(1),
});

const updatePostBody = z
  .object({
    title: z.string().trim().min(1).optional(),
    content: z.string().trim().min(1).optional(),
    author: z.string().trim().min(1).optional(),
  })
  .refine((body) => Object.keys(body).length > 0, {
    message: "Provide at least one of: title, content, author",
  });

module.exports = {
  registerBody,
  loginBody,
  createPostBody,
  updatePostBody,
};
