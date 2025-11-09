import * as NoteService from '../services/note_service.js';
import * as db from '../data/db_adapter.js';

// Mock DB module
jest.mock('../data/db_adapter.js');

// Two users and two notes for auth checks
const USER_ID_1 = 1;
const USER_ID_2 = 2;

const NOTE_1 = { id: 101, title: 'User 1 Note', content: 'Content', user_id: USER_ID_1 };
const NOTE_2 = { id: 102, title: 'User 2 Note', content: 'Content', user_id: USER_ID_2 };

// Tests for NoteService

describe('NoteService', () => {

    beforeEach(() => {
        // reset mocks each test
        jest.clearAllMocks();
    });

    // createNote
    describe('createNote', () => {
        test('creates a note and returns the new ID', async () => {
            // db.run returns last inserted ID
            db.run.mockResolvedValue(103); 
            
            const result = await NoteService.createNote(USER_ID_1, { 
                title: 'New Note', 
                content: 'Some Content' 
            });

            expect(db.run).toHaveBeenCalledTimes(1);
            // ensure user_id was passed to INSERT
            expect(db.run).toHaveBeenCalledWith(
                expect.any(String),
                ['New Note', 'Some Content', USER_ID_1]
            );
            expect(result).toBe(103);
        });

        test('should successfully create a note containing JSON order data', async () => {
            db.run.mockResolvedValueOnce(6); // lastID = 6
            
            // create JSON-content for order
            const orderDataJson = JSON.stringify({
                order_items: [{ productId: 1, quantity: 2 }],
                total_amount: 30.00
            });
            
            const orderTitle = 'Order: 2025-11-06T10:00:00Z';
            const noteData = { title: orderTitle, content: orderDataJson };
            
            const result = await NoteService.createNote(USER_ID_1, noteData);
            
            expect(db.run).toHaveBeenCalledTimes(1);
            // Check if contetnt is json
            expect(db.run).toHaveBeenCalledWith(
                expect.any(String), 
                [orderTitle, orderDataJson, USER_ID_1]
            );
            expect(result).toBe(6);
        });
    });
    
    // getNoteById (authorization)
    describe('getNoteById', () => {
        test('returns note when it belongs to the requester', async () => {
            // DB returns the note
            db.get.mockResolvedValue(NOTE_1); 
            
            const result = await NoteService.getNoteById(NOTE_1.id, USER_ID_1);

            // query should filter by id AND user_id
            expect(db.get).toHaveBeenCalledWith(
                expect.stringContaining('WHERE id = ? AND user_id = ?'), 
                [NOTE_1.id, USER_ID_1]
            );
            expect(result).toEqual(NOTE_1);
        });

        test('returns null when note belongs to someone else', async () => {
            // DB returns null for forbidden access
            db.get.mockResolvedValue(null); 
            
            const result = await NoteService.getNoteById(NOTE_1.id, USER_ID_2);

            // query still runs but result is null
            expect(db.get).toHaveBeenCalledTimes(1);
            expect(result).toBeNull();
        });
    });
    
    // updateNote (authorization)
    describe('updateNote', () => {
        // include content so call args match implementation
        const updatePayload = { 
            title: 'Updated Title',
            content: 'New Content Body'
        };
        
        test('updates note when it belongs to the requester', async () => {
            // db.run returns affected rows = 1
            db.run.mockResolvedValue(1); 
            
            await NoteService.updateNote(NOTE_1.id, USER_ID_1, updatePayload);

            expect(db.run).toHaveBeenCalledTimes(1);
            // UPDATE should include id AND user_id in WHERE
            expect(db.run).toHaveBeenCalledWith(
                expect.stringContaining('WHERE id = ? AND user_id = ?'), 
                [
                    updatePayload.title,
                    updatePayload.content,
                    NOTE_1.id,
                    USER_ID_1
                ]
            );
        });

        test('does not update when note belongs to someone else', async () => {
            // db.run returns 0 rows updated
            db.run.mockResolvedValue(0); 
            
            await NoteService.updateNote(NOTE_1.id, USER_ID_2, updatePayload);

            expect(db.run).toHaveBeenCalledTimes(1);
            expect(db.run).toHaveBeenCalledWith(
                expect.stringContaining('WHERE id = ? AND user_id = ?'),
                [
                    updatePayload.title, 
                    updatePayload.content, 
                    NOTE_1.id, 
                    USER_ID_2
                ]
            );
        });
    });

    // deleteNote (authorization)
    describe('deleteNote', () => {
        test('deletes note when it belongs to the requester', async () => {
            // db.run returns 1 row deleted
            db.run.mockResolvedValue(1); 
            
            await NoteService.deleteNote(NOTE_1.id, USER_ID_1);

            expect(db.run).toHaveBeenCalledTimes(1);
            // DELETE should include id AND user_id
            expect(db.run).toHaveBeenCalledWith(
                expect.stringContaining('DELETE FROM notes WHERE id = ? AND user_id = ?'), 
                [NOTE_1.id, USER_ID_1]
            );
        });

        test('does not delete when note belongs to someone else', async () => {
            // db.run returns 0 rows deleted
            db.run.mockResolvedValue(0); 
            
            await NoteService.deleteNote(NOTE_1.id, USER_ID_2);

            expect(db.run).toHaveBeenCalledTimes(1);
            // query runs with wrong user_id -> no deletion
            expect(db.run).toHaveBeenCalledWith(
                expect.stringContaining('DELETE FROM notes WHERE id = ? AND user_id = ?'), 
                [NOTE_1.id, USER_ID_2]
            );
        });
    });
    
    // getAllNotes
    describe('getAllNotes', () => {
        test('returns only notes for the given user', async () => {
            const user1Notes = [
                { id: 101, title: 'Note 1' },
                { id: 103, title: 'Note 3' }
            ];
            // DB returns notes for user 1
            db.all.mockResolvedValue(user1Notes); 
            
            const result = await NoteService.getAllNotes(USER_ID_1);

            expect(db.all).toHaveBeenCalledTimes(1);
            // should filter by user_id
            expect(db.all).toHaveBeenCalledWith(
                expect.stringContaining('WHERE user_id = ?'), 
                [USER_ID_1]
            );
            expect(result).toEqual(user1Notes);
        });
    });
});