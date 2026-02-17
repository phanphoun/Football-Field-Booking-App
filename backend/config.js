

require('dotenv').config();
const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
const db = mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'football_booking'
});

db.connect((err) => {
    if (err) {
        console.error('Error connecting to database:', err);
        console.error('Connection details:', {
            host: process.env.DB_HOST,
            user: process.env.DB_USER,
            database: process.env.DB_NAME,
            passwordSet: !!process.env.DB_PASSWORD
        });
        return;
    }
    console.log('Connected to MySQL database: football_booking');
});

module.exports = { app, db };

