const configurePostRoutes = require("./routes/post");
const configureUserRoutes = require("./routes/user");

module.exports = (router) => {
  configurePostRoutes(router);
  configureUserRoutes(router);
};
