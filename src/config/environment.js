const { z } = require("zod");

const DEFAULT_MONGODB_URI = "mongodb://127.0.0.1:27017/database";

const environmentSchema = z.object({
  TOKEN_SECRET: z.string().min(1, "TOKEN_SECRET is required"),
  MONGODB_URI: z.string().min(1).default(DEFAULT_MONGODB_URI),
  PORT: z.preprocess(
    (value) => (value === undefined || value === "" ? undefined : value),
    z.coerce.number().int().min(1).max(65535).default(5000)
  ),
});

function loadEnvironment(source = process.env) {
  const result = environmentSchema.safeParse(source);
  if (!result.success) {
    const details = result.error.issues
      .map((issue) => `${issue.path.join(".")}: ${issue.message}`)
      .join("; ");
    throw new Error(`Invalid environment configuration: ${details}`);
  }
  return result.data;
}

module.exports = { environmentSchema, loadEnvironment };
