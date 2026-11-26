const test = require("node:test");
const assert = require("node:assert/strict");
const User = require("./User");

test("API keys are unique without requiring one for every user", () => {
  const apiKeyIndex = User.schema
    .indexes()
    .find(([keys]) => keys.apiKey === 1);

  assert.ok(apiKeyIndex);
  assert.equal(apiKeyIndex[1].unique, true);
  assert.equal(apiKeyIndex[1].sparse, true);
});
