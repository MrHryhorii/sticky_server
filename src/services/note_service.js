import * as db from '../data/db_adapter.js';

// Creates a new note for a specific user
export async function createNote(userId, { title, content }) {
    const lastID = await db.run(
        // Include user_id in the INSERT statement
        'INSERT INTO notes (title, content, user_id) VALUES (?, ?, ?)', 
        [title, content, userId]
    );
    return lastID;
}

// Gets a single note by ID, ensuring it belongs to the user
export async function getNoteById(noteId, userId) {
    // WHERE clause MUST include user_id
    return db.get(
        'SELECT id, title, content, is_order FROM notes WHERE id = ? AND user_id = ?', 
        [noteId, userId]
    );
}

// Gets all notes for a specific user
export async function getAllNotes(userId) {
    // Get notes ONLY where user_id matches
    return db.all(
        'SELECT id, title, content FROM notes WHERE user_id = ?', 
        [userId]
    );
}

// Updates an existing note
export async function updateNote(noteId, userId, { title, content }) {
    // Update only if note belongs to user
    await db.run(
        'UPDATE notes SET title = ?, content = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?',
        [title, content, noteId, userId]
    );
}

// Deletes a note
export async function deleteNote(noteId, userId) {
    // Delete only if note belongs to user
    await db.run(
        'DELETE FROM notes WHERE id = ? AND user_id = ?', 
        [noteId, userId]
    );
}

// Select all note data, including user_id
export async function adminGetAllNotes(limit, offset) {
    // Get notes for page
    const totalResult = await db.get('SELECT COUNT(id) AS count FROM notes');
    const totalCount = totalResult.count;
    // Get data with LIMIT and OFFSET
    const notes = await db.all(
        `SELECT id, title, content, user_id, created_at, updated_at 
         FROM notes 
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?`,
        [limit, offset]
    );

    return { notes, totalCount };
}

// Gets a single note by ID for admin
export async function adminGetNoteById(noteId) {
    return db.get(
        'SELECT id, title, content, user_id, created_at FROM notes WHERE id = ?', 
        [noteId]
    );
}

// Deletes a note by admin
export async function adminDeleteNote(noteId) {
    const affectedRows = await db.run('DELETE FROM notes WHERE id = ?', [noteId]);
    // true if something is deleted
    return affectedRows > 0; 
}