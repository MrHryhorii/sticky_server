import { 
    checkAdminRole, 
    listUsers, 
    deleteUser, 
    listAllNotes, 
    deleteNote 
} from '../api/admin_controller.js';
import * as userService from '../services/user_service.js';
import * as noteService from '../services/note_service.js';

// Mock services
jest.mock('../services/user_service.js');
jest.mock('../services/note_service.js');

const USER_ID = 1;
const TARGET_USER_ID = 5;
const NOTE_ID = 10;
const MOCK_ADMIN = { id: USER_ID, role: 'admin' };
const MOCK_USER = { id: USER_ID, role: 'user' };

// Helper to mock res object
const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnThis();
    res.json = jest.fn().mockReturnThis();
    res.send = jest.fn().mockReturnThis();
    return res;
};

beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterEach(() => {
    jest.restoreAllMocks();
});

// Tests for checkAdminRole
describe('Admin Controller: checkAdminRole', () => {
    test('should return true and not send response if user is admin', () => {
        const req = { user: MOCK_ADMIN };
        const res = mockResponse();

        const result = checkAdminRole(req, res);

        expect(result).toBe(true);
        expect(res.status).not.toHaveBeenCalled();
    });

    test('should return false and send 403 Forbidden if user is not admin', () => {
        const req = { user: MOCK_USER };
        const res = mockResponse();

        const result = checkAdminRole(req, res);

        expect(result).toBe(false);
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden: Admin access required.' });
    });
});

// Tests for listUsers
describe('Admin Controller: listUsers', () => {
    let res;

    beforeEach(() => {
        res = mockResponse();
        jest.clearAllMocks();
    });
    
    test('should return 200 and a list of users with pagination meta', async () => {
        const req = { 
            user: MOCK_ADMIN,
            query: { page: '2', limit: '10' },
            protocol: 'http', get: jest.fn(() => 'localhost:9001'), baseUrl: '/api/admin', path: '/users'
        };
        const MOCK_USERS_DATA = { 
            users: [{ id: 10, username: 'user10' }], 
            totalCount: 25 
        };
        
        userService.getAllUsers.mockResolvedValue(MOCK_USERS_DATA);

        await listUsers(req, res);

        expect(userService.getAllUsers).toHaveBeenCalledWith(10, 10);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                data: MOCK_USERS_DATA.users,
                meta: expect.objectContaining({
                    currentPage: 2, 
                    totalPages: 3
                }),
            })
        );
    });
    
    test('should return 500 for an unexpected service error', async () => {
        const req = { user: MOCK_ADMIN, query: {} };
        userService.getAllUsers.mockRejectedValue(new Error('DB connection failed.'));

        await listUsers(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error during user listing.' });
    });
    
    test('should return 403 if the user is not an admin', async () => {
        const req = { user: MOCK_USER, query: {} };

        await listUsers(req, res);

        expect(userService.getAllUsers).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403); 
    });
});

// Tests for deleteUser
describe('Admin Controller: deleteUser', () => {
    let res;
    
    beforeEach(() => {
        res = mockResponse();
        jest.clearAllMocks();
    });

    test('should delete a user and return 204', async () => {
        const req = { user: MOCK_ADMIN, params: { id: TARGET_USER_ID } };
        userService.deleteUser.mockResolvedValue(true); 

        await deleteUser(req, res);

        expect(userService.deleteUser).toHaveBeenCalledWith(TARGET_USER_ID);
        expect(res.status).toHaveBeenCalledWith(204);
        expect(res.send).toHaveBeenCalled();
    });

    test('should return 403 if admin tries to delete their own account', async () => {
        const req = { user: MOCK_ADMIN, params: { id: USER_ID } }; 

        await deleteUser(req, res);

        expect(userService.deleteUser).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403); 
        expect(res.json).toHaveBeenCalledWith({ message: 'You cannot delete your own account via this admin route.' });
    });

    test('should return 404 if the user is not found', async () => {
        const req = { user: MOCK_ADMIN, params: { id: 999 } };
        userService.deleteUser.mockResolvedValue(false); 

        await deleteUser(req, res);

        expect(res.status).toHaveBeenCalledWith(404); 
        expect(res.json).toHaveBeenCalledWith({ message: 'User not found.' });
    });

    test('should return 403 if the user is not an admin', async () => {
        const req = { user: MOCK_USER, params: { id: TARGET_USER_ID } };

        await deleteUser(req, res);

        expect(userService.deleteUser).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
    });
});

// Tests for listAllNotes
describe('Admin Controller: listAllNotes', () => {
    let res;

    beforeEach(() => {
        res = mockResponse();
        jest.clearAllMocks();
    });
    
    test('should return 200 and a list of all notes with pagination meta', async () => {
        const req = { 
            user: MOCK_ADMIN, 
            query: { page: '1', limit: '20' },
            protocol: 'http', get: jest.fn(() => 'localhost:9001'), baseUrl: '/api/admin', path: '/notes'
        };
        const MOCK_NOTES_DATA = { 
            notes: [{ id: 1, user_id: 1, title: 'Note 1' }], 
            totalCount: 45 
        };
        
        noteService.adminGetAllNotes.mockResolvedValue(MOCK_NOTES_DATA);

        await listAllNotes(req, res);

        expect(noteService.adminGetAllNotes).toHaveBeenCalledWith(20, 0); 
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                data: MOCK_NOTES_DATA.notes,
                meta: expect.objectContaining({ 
                    currentPage: 1, 
                    totalPages: 3
                }),
            })
        );
    });
    
    test('should return 500 for an unexpected service error', async () => {
        const req = { user: MOCK_ADMIN, query: {} };
        noteService.adminGetAllNotes.mockRejectedValue(new Error('DB error.'));

        await listAllNotes(req, res);

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error during note listing.' });
    });
    
    test('should return 403 if the user is not an admin', async () => {
        const req = { user: MOCK_USER, query: {} };

        await listAllNotes(req, res);

        expect(noteService.adminGetAllNotes).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
    });
});


// Tests for deleteNote
describe('Admin Controller: deleteNote', () => {
    let res;
    
    beforeEach(() => {
        res = mockResponse();
        jest.clearAllMocks();
    });

    test('should delete a note and return 204', async () => {
        const req = { user: MOCK_ADMIN, params: { id: NOTE_ID } };
        noteService.adminDeleteNote.mockResolvedValue(true); 

        await deleteNote(req, res);

        expect(noteService.adminDeleteNote).toHaveBeenCalledWith(NOTE_ID);
        expect(res.status).toHaveBeenCalledWith(204);
        expect(res.send).toHaveBeenCalled();
    });

    test('should return 404 if the note is not found', async () => {
        const req = { user: MOCK_ADMIN, params: { id: 999 } };
        noteService.adminDeleteNote.mockResolvedValue(false); 

        await deleteNote(req, res);

        expect(res.status).toHaveBeenCalledWith(404); 
        expect(res.json).toHaveBeenCalledWith({ message: 'Note not found.' });
    });
    
    test('should return 403 if the user is not an admin', async () => {
        const req = { user: MOCK_USER, params: { id: NOTE_ID } };

        await deleteNote(req, res);

        expect(noteService.adminDeleteNote).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
    });
});