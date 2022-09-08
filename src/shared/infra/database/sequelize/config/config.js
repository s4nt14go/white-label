/* eslint-disable @typescript-eslint/no-var-requires,no-undef */
const pg = require('pg');
const { Sequelize } = require('sequelize');
require('dotenv').config();

// Workaround to fix DECIMALs being returned as strings instead of numbers
Sequelize.postgres.DECIMAL.parse = function (value) {
  return parseFloat(value);
};

const {
  COCKROACH_username,
  COCKROACH_password,
  COCKROACH_database,
  COCKROACH_host,
  COCKROACH_dialect,
  COCKROACH_port,
  COCKROACH_cluster,
} = process.env;

const databaseCredentials = {
  username: COCKROACH_username,
  password: COCKROACH_password,
  database: COCKROACH_database,
  host: COCKROACH_host,
  dialect: COCKROACH_dialect,
  dialectModule: pg,
  port: COCKROACH_port,
  dialectOptions: {
    options: `--cluster=${COCKROACH_cluster}`,
    ssl: {},
  },
};

module.exports = databaseCredentials;

const connection = new Sequelize(
  databaseCredentials.database,
  databaseCredentials.username,
  databaseCredentials.password,
  {
    host: databaseCredentials.host,
    dialect: databaseCredentials.dialect,
    dialectModule: pg,
    port: databaseCredentials.port,
    dialectOptions: databaseCredentials.dialectOptions,
    pool: {
      max: 2,
      acquire: 3000,
    },
  }
);
module.exports.connection = connection;
