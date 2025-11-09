import bcrypt from 'bcryptjs';
import * as db from '../data/db_adapter.js';

const saltRounds = 10; // Number of hashing rounds for bcrypt

// Registers a new user. Assigns 'admin' role to the very first user
export async function registerUser(username, password) {
    // Check if user already exists
    const existingUser = await db.get('SELECT id FROM users WHERE username = ?', [username]);
    if (existingUser) {
        return null; // User already exists
    }
    // Determine Role: Check if any user exists in the database
    const totalUsers = await db.get('SELECT COUNT(id) as count FROM users');
    const isFirstUser = totalUsers.count === 0;
    // First user will have role 'admin', other - 'user'
    const role = isFirstUser ? 'admin' : 'user'; 
    // Hash the password securely
    const passwordHash = await bcrypt.hash(password, saltRounds);
    // Save user credentials, including the role
    try {
        const userId = await db.run(
            'INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)', 
            [username, passwordHash, role]
        );
        return userId;
    } catch (e) {
        console.error('Database error during user registration:', e);
        throw new Error('Could not register user due to database issue.');
    }
}

// Authenticates a user against the stored hash and retrieves their role
export async function authenticateUser(username, password) {
    // Fetch user data, including the stored hash AND ROLE
    const user = await db.get('SELECT id, username, password_hash, role FROM users WHERE username = ?', [username]);
    if (!user) {
        return null; // User not found
    }
    // Compare the plain text password with the stored hash
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (isMatch) {
        // Return public user data (ID, username, role)
        const { password_hash, ...publicUser } = user; 
        return publicUser;
    }
    return null; // Password mismatch
}

// Deletes a user by ID
export async function deleteUser(userId) {
    // Check if user exists
    const user = await db.get('SELECT id FROM users WHERE id = ?', [userId]);
    if (!user) {
        return false; // User not found
    }
    // Delete the user (this triggers CASCADE deletion of notes)
    await db.run('DELETE FROM users WHERE id = ?', [userId]);
    return true; // Deletion successful
}

// Select all user data EXCEPT the password hash
export async function getAllUsers(limit, offset) {
    // count users
    const totalResult = await db.get('SELECT COUNT(id) AS count FROM users');
    const totalCount = totalResult.count;
    // data for page
    const users = await db.all(
        `SELECT id, username, role, created_at, updated_at 
         FROM users 
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?`,
        [limit, offset]
    );

    return { users, totalCount };
}

// Delete user account
export async function deleteOwnAccount(userId) {
    const affectedRows = await db.run('DELETE FROM users WHERE id = ?', [userId]);
    // true - success
    return affectedRows > 0;
}