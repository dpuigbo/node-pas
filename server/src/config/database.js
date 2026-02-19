const path = require('path');
const fs = require('fs');

const projectRoot = path.resolve(__dirname, '../../..');
const dbPath = process.env.DB_PATH || path.join(projectRoot, 'data', 'pas.db');

// Ensure the data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

module.exports = {
  client: 'better-sqlite3',
  connection: {
    filename: dbPath,
  },
  useNullAsDefault: true,
  pool: {
    afterCreate(conn, cb) {
      conn.pragma('journal_mode = WAL');
      conn.pragma('foreign_keys = ON');
      cb();
    },
  },
};
