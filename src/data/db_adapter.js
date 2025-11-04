import sqlite3 from 'sqlite3';
// Create Database object
const { Database } = sqlite3.verbose();

// Get the DB path from the .envY
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
            
            // Create Users table (for authentication)
            db.run(`CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                username TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                role TEXT DEFAULT 'user' NOT NULL,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
                updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL
            )`, (err) => {
                if (err) return reject(err);
                
                // Create Notes table (linked to users)
                db.run(`CREATE TABLE IF NOT EXISTS notes (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    content TEXT,
                    user_id INTEGER NOT NULL,
                    created_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    updated_at TEXT DEFAULT CURRENT_TIMESTAMP NOT NULL,
                    FOREIGN KEY(user_id) REFERENCES users(id)
                )`, (err) => {
                    if (err) return reject(err);
                    console.log("Tables 'users' and 'notes' are ready.");
                    resolve();
                });
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