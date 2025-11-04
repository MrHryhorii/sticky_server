import sqlite3 from 'sqlite3';
// Create Database object
const { Database } = sqlite3.verbose();

// Get the DB path from the .env
const DB_PATH = process.env.DB_PATH;

let db;

export function initDb() {
    return new Promise((resolve, reject) => {
        // Init DB
        db = new Database(DB_PATH, (err) => {
            if (err) {
                console.error('DB connection error:', err.message);
                return reject(err);
            }
            console.log(`Successfully connected to SQLite DB at: ${DB_PATH}`);
            
            // Multi-statement SQL for creating all tables
            const createTablesSQL = `
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    username TEXT UNIQUE NOT NULL,
                    password_hash TEXT NOT NULL,
                    role TEXT DEFAULT 'user' NOT NULL,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
                );

                CREATE TABLE IF NOT EXISTS notes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    content TEXT, -- Will store Order JSON
                    user_id INTEGER NOT NULL,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS products (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL UNIQUE,
                    description TEXT,
                    price REAL NOT NULL,
                    category TEXT,
                    tags TEXT,
                    extra_info TEXT,
                    image_url TEXT,
                    is_active INTEGER DEFAULT 1,
                    created_by_id INTEGER,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (created_by_id) REFERENCES users(id) ON DELETE SET NULL
                );
            `;

            // Run the multi-statement string
            db.exec(createTablesSQL, (err) => {
                if (err) {
                    console.error('Table creation error:', err.message);
                    return reject(err);
                }
                console.log("Tables 'users', 'notes', and 'products' are ready.");
                resolve();
            });
        });
    });
}

// Function to execute a GET query (single row)
export function get(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) reject(err); else resolve(row);
        });
    });
}

// Function to execute an ALL query (multiple rows)
export function all(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
            if (err) reject(err); else resolve(rows);
        });
    });
}

// Function to execute a RUN query (INSERT, UPDATE, DELETE)
export function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
            if (err) {
                reject(err);
            } else {
                if (sql.trim().toUpperCase().startsWith('INSERT')) {
                    resolve(this.lastID);
                } else {
                    resolve(this.changes);
                }
            }
        });
    });
}