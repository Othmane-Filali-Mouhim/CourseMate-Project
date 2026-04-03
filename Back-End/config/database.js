// ─── MySQL Connection ──────────────────────────────────
// This file creates a connection pool to the MySQL database.
// Other files import this to run queries.

const mysql = require('mysql2');
require('dotenv').config();

// Create a connection pool
const pool = mysql.createPool({
    host: process.env.DB_HOST,         // 'localhost' from .env
    user: process.env.DB_USER,         // 'root' from .env
    password: process.env.DB_PASSWORD, // your password from .env
    database: process.env.DB_NAME,     // 'coursemate' from .env
    waitForConnections: true,          // wait if all connections are busy
    connectionLimit: 10                // max 10 simultaneous connections
});

// Use promises (so we can use async/await instead of callbacks)
const db = pool.promise();

module.exports = db;
