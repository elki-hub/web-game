const dotenv = require("dotenv");
dotenv.config();
const { Client } = require("pg");

const database = new Client({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
});
database.connect();

module.exports = {
  database,
};
