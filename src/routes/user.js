const { register, login } = require("../controllers/user");
const validate = require("../middleware/validate");
const { registerBody, loginBody } = require("../validators/requests");

module.exports = (router) => {
  router.post("/auth/register", validate(registerBody), register);
  router.post("/auth/login", validate(loginBody), login);
};
