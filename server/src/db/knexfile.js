require('dotenv').config({ path: require('path').join(__dirname, '../../../.env') });
const dbConfig = require('../config/database');

module.exports = {
  ...dbConfig,
  migrations: {
    directory: './migrations',
  },
  seeds: {
    directory: './seeds',
  },
};
