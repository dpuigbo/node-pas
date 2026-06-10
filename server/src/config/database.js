module.exports = {
  client: 'mysql2',
  connection: {
    host: process.env.DB_HOST || '127.0.0.1',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    user: process.env.DB_USER || 'pas_user',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'pas_robotics',
    charset: 'utf8mb4',
    timezone: '+00:00',
  },
  pool: {
    min: 0,
    max: 10,
  },
};
