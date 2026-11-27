require("dotenv").config();

const { loadEnvironment } = require("./environment");

module.exports = loadEnvironment();
