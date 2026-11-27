const test = require("node:test");
const assert = require("node:assert/strict");
const { loadEnvironment } = require("./environment");

test("environment config supplies defaults and parses the port", () => {
  assert.equal(loadEnvironment({ TOKEN_SECRET: "test-secret" }).PORT, 5000);
  assert.deepEqual(
    loadEnvironment({ TOKEN_SECRET: "test-secret", PORT: "3001" }),
    {
      TOKEN_SECRET: "test-secret",
      MONGODB_URI: "mongodb://127.0.0.1:27017/database",
      PORT: 3001,
    }
  );
});

test("environment config rejects missing secrets and invalid ports", () => {
  assert.throws(() => loadEnvironment({}), /TOKEN_SECRET/);
  assert.throws(
    () => loadEnvironment({ TOKEN_SECRET: "test-secret", PORT: "70000" }),
    /PORT/
  );
});
