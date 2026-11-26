const test = require("node:test");
const assert = require("node:assert/strict");
const buffer = require("node:buffer");

test("jsonwebtoken can sign and verify tokens after buffer compatibility setup", () => {
  const slowBufferWasAvailable = typeof buffer.SlowBuffer !== "undefined";
  require("./buffer-compat");

  assert.equal(typeof buffer.SlowBuffer, "function");
  if (!slowBufferWasAvailable) {
    assert.equal(buffer.SlowBuffer, buffer.Buffer);
  }

  const jwt = require("jsonwebtoken");
  const token = jwt.sign({ test: true }, "test-secret");

  assert.equal(jwt.verify(token, "test-secret").test, true);
});
