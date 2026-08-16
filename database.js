const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const dbPath = path.join(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
        console.error('Error opening database:', err.message);
    } else {
        console.log('Connected to SQLite database.');
        createTables();
    }
});

function createTables() {
    db.serialize(() => {
        // Users Table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            first_name TEXT,
            last_name TEXT,
            phone TEXT,
            dob TEXT,
            country TEXT,
            avatar TEXT,
            nickname TEXT,
            tier_level TEXT DEFAULT 'Level 1',
            balance REAL DEFAULT 200.0,
            earnings REAL DEFAULT 0.0,
            invites_count INTEGER DEFAULT 0,
            is_admin INTEGER DEFAULT 0
        )`);

        // Payment Methods Table
        db.run(`CREATE TABLE IF NOT EXISTS payment_methods (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            method_type TEXT NOT NULL,
            provider TEXT NOT NULL,
            account_number TEXT NOT NULL,
            account_name TEXT NOT NULL,
            expiry_date TEXT,
            cvv TEXT,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )`);

        // Investments Table
        db.run(`CREATE TABLE IF NOT EXISTS investments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            plan_name TEXT NOT NULL,
            amount REAL NOT NULL,
            daily_return REAL NOT NULL,
            date_created DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )`);

        // Withdrawals Table
        db.run(`CREATE TABLE IF NOT EXISTS withdrawals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            status TEXT DEFAULT 'pending',
            date_created DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )`);

        // Deposits Table (Crypto confirmations)
        db.run(`CREATE TABLE IF NOT EXISTS deposits (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            amount REAL NOT NULL,
            wallet_address TEXT NOT NULL,
            status TEXT DEFAULT 'pending',
            date_created DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
        )`);
        
        console.log('Database tables verified/created successfully.');

        // Migration and seeding check
        db.all("PRAGMA table_info(users)", (err, info) => {
            if (!err && info) {
                const hasIsAdmin = info.some(col => col.name === 'is_admin');
                if (!hasIsAdmin) {
                    db.run(`ALTER TABLE users ADD COLUMN is_admin INTEGER DEFAULT 0`, (err) => {
                        if (err) {
                            console.error("Error altering users table for is_admin:", err.message);
                        } else {
                            console.log("Added column is_admin to users table.");
                        }
                        seedAdmin();
                    });
                } else {
                    seedAdmin();
                }
            } else {
                seedAdmin();
            }
        });
    });
}

function seedAdmin() {
    const bcrypt = require('bcryptjs');
    db.get(`SELECT * FROM users WHERE email = ? OR name = ?`, ['admin', 'admin'], (err, row) => {
        if (!err && !row) {
            bcrypt.hash('admin', 10, (err, hashedPassword) => {
                if (!err) {
                    db.run(`INSERT INTO users (name, email, password, is_admin) VALUES (?, ?, ?, 1)`,
                        ['Admin', 'admin', hashedPassword], (err) => {
                            if (err) {
                                console.error('Failed to seed admin user:', err.message);
                            } else {
                                console.log('Successfully seeded admin user: admin / admin');
                            }
                        }
                    );
                }
            });
        }
    });
}

module.exports = db;
