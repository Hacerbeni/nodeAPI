const test = require("node:test");
const assert = require("node:assert/strict");
const {
  registerBody,
  loginBody,
  createPostBody,
  updatePostBody,
} = require("./requests");

test("registration schema normalizes valid user fields and rejects invalid email", () => {
  const valid = registerBody.safeParse({
    firstName: " Ada ",
    lastName: " Lovelace ",
    username: "ada",
    email: " ADA@example.com ",
    password: "secret",
  });
  assert.equal(valid.success, true);
  assert.equal(valid.data.firstName, "Ada");
  assert.equal(valid.data.email, "ada@example.com");

  const invalid = registerBody.safeParse({
    firstName: "Ada",
    lastName: "Lovelace",
    username: "ada",
    email: "not-an-email",
    password: "secret",
  });
  assert.equal(invalid.success, false);
});

test("login schema requires both a valid email and a password", () => {
  assert.equal(
    loginBody.safeParse({ email: "user@example.com", password: "secret" })
      .success,
    true
  );
  assert.equal(
    loginBody.safeParse({ email: "user@example.com", password: "" }).success,
    false
  );
});

test("post schemas reject empty content and updates without editable fields", () => {
  assert.equal(
    createPostBody.safeParse({
      title: "Title",
      content: "Body",
      author: "Ada",
    }).success,
    true
  );
  assert.equal(
    createPostBody.safeParse({ title: " ", content: "Body", author: "Ada" })
      .success,
    false
  );
  assert.equal(updatePostBody.safeParse({}).success, false);
  assert.equal(updatePostBody.safeParse({ title: "Updated" }).success, true);
});
