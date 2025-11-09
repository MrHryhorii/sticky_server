var mockNoteService = {
    getNoteById: jest.fn(),
    getAllNotes: jest.fn(),
    createNote: jest.fn(),
    updateNote: jest.fn(),
    deleteNote: jest.fn(),
};

var mockOrderService = {
    createStructuredOrder: jest.fn(),
};

var mockNoteSchema = {
    parse: jest.fn(),
};

var mockOrderSchema = {
    parse: jest.fn(),
};

var mockOrderUtils = {
    isOrderNote: jest.fn(),
};

// Mock modules (returns mock objects)
jest.mock('../services/note_service.js', () => mockNoteService); 
jest.mock('../services/order_service.js', () => mockOrderService);
jest.mock('../schemas/note_schema.js', () => ({ NoteSchema: mockNoteSchema }));
jest.mock('../schemas/order_schema.js', () => ({ orderSchema: mockOrderSchema }));
jest.mock('../utils/order_utils.js', () => ({ isOrderNote: mockOrderUtils.isOrderNote }));

// Minimal ZodError mock for tests
class ZodError extends Error {
    constructor(issues) {
        super("Zod validation failed");
        this.name = 'ZodError';
        this.issues = issues;
        this.errors = issues;
    }
}

// Controller functions
import { getNotes, getNote, createNote, updateNote, deleteNote } from '../api/note_controller.js';


// Test sample data
const USER_ID = 1;
const NOTE_ID = 101;
const NEW_NOTE_ID = 50;

const REGULAR_NOTE = { 
    id: NOTE_ID, 
    title: 'Test Note', 
    content: 'Some regular content', 
    is_order: 0, 
    user_id: USER_ID 
};

const ORDER_NOTE_CONTENT = { total_amount: 100, items: [{id: 1, quantity: 2}] };
const ORDER_NOTE = { 
    id: 999, 
    title: 'Order Note', 
    content: JSON.stringify(ORDER_NOTE_CONTENT), 
    is_order: 1, 
    user_id: USER_ID 
};

const mockReq = (options = {}) => ({
    params: options.params || {},
    body: options.body || {},
    user: options.user || { id: USER_ID, role: 'user' },
    ...options
});

const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.send = jest.fn().mockReturnValue(res);
    return res;
};

// silence console.error in tests
global.console = { ...global.console, error: jest.fn() };

// Tests
describe('User Note Controllers (CRUD)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockOrderUtils.isOrderNote.mockReturnValue(false);
    });

    // GET /api/notes
    describe('getNotes', () => {
        test('returns 200 and all notes for user', async () => {
            const notes = [REGULAR_NOTE, { ...REGULAR_NOTE, id: 102 }];
            mockNoteService.getAllNotes.mockResolvedValue(notes);
            
            const req = mockReq();
            const res = mockRes();

            await getNotes(req, res);

            expect(mockNoteService.getAllNotes).toHaveBeenCalledWith(USER_ID);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(notes);
        });

        test('returns 500 on service error', async () => {
            const serviceError = new Error('DB timeout');
            mockNoteService.getAllNotes.mockRejectedValue(serviceError);
            
            const req = mockReq();
            const res = mockRes();

            await getNotes(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error.' });
        });
    });

    // GET /api/notes/:id
    describe('getNote', () => {
        test('returns 200 and the requested note for user', async () => {
            mockNoteService.getNoteById.mockResolvedValue(REGULAR_NOTE);
            
            const req = mockReq({ params: { id: NOTE_ID } });
            const res = mockRes();

            await getNote(req, res);

            expect(mockNoteService.getNoteById).toHaveBeenCalledWith(NOTE_ID, USER_ID);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(REGULAR_NOTE);
        });

        test('returns 404 if note not found or not owned', async () => {
            mockNoteService.getNoteById.mockResolvedValue(null);
            
            const req = mockReq({ params: { id: 999 } });
            const res = mockRes();

            await getNote(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Note not found or you do not own it.' });
        });

        test('returns 500 on service error', async () => {
            const serviceError = new Error('DB timeout');
            mockNoteService.getNoteById.mockRejectedValue(serviceError);
            
            const req = mockReq({ params: { id: NOTE_ID } });
            const res = mockRes();

            await getNote(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error.' });
        });
    });
    
    // POST /api/notes
    describe('createNote', () => {
        const VALID_NOTE_BODY = { title: 'New Note', content: 'This is new content' };
        const VALID_ORDER_BODY = [{ productId: 1, quantity: 2 }];
        const MOCKED_ORDER_DATA = { total_amount: 100, items: VALID_ORDER_BODY };
        
        test('creates a regular note and returns 201', async () => {
            mockOrderSchema.parse.mockImplementation(() => { throw new ZodError([{ path: ['items'], message: 'Not an order' }]); });
            mockNoteSchema.parse.mockReturnValue(VALID_NOTE_BODY);
            mockNoteService.createNote.mockResolvedValue(NEW_NOTE_ID);
            
            const req = mockReq({ body: VALID_NOTE_BODY });
            const res = mockRes();

            await createNote(req, res);

            expect(mockNoteSchema.parse).toHaveBeenCalledWith(VALID_NOTE_BODY);
            expect(mockNoteService.createNote).toHaveBeenCalledWith(USER_ID, VALID_NOTE_BODY);
            expect(mockOrderService.createStructuredOrder).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ 
                id: NEW_NOTE_ID,
                title: VALID_NOTE_BODY.title,
                content: VALID_NOTE_BODY.content,
                message: 'Note successfully created.' 
            });
        });
        
        test('creates an order note and returns 201 with order data', async () => {
            mockOrderSchema.parse.mockReturnValue(VALID_ORDER_BODY);
            mockOrderService.createStructuredOrder.mockResolvedValue(MOCKED_ORDER_DATA);
            mockNoteService.createNote.mockResolvedValue(NEW_NOTE_ID);
            
            const req = mockReq({ body: VALID_ORDER_BODY });
            const res = mockRes();

            await createNote(req, res);

            expect(mockOrderSchema.parse).toHaveBeenCalledWith(VALID_ORDER_BODY);
            expect(mockOrderService.createStructuredOrder).toHaveBeenCalledWith(USER_ID, VALID_ORDER_BODY);
            expect(mockNoteService.createNote).toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({ 
                id: NEW_NOTE_ID, 
                message: 'Order created successfully.', 
                order: MOCKED_ORDER_DATA 
            });
        });

        test('returns 400 on Zod validation error for note fallback', async () => {
            const zodIssues = [{ path: ['title'], message: 'Too short' }];
            const zodError = new ZodError(zodIssues);

            mockOrderSchema.parse.mockImplementation(() => { throw new ZodError([{ path: ['items'], message: 'Not an order' }]); });
            mockNoteSchema.parse.mockImplementation(() => { throw zodError; });
            
            const req = mockReq({ body: {} });
            const res = mockRes();

            await createNote(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Validation error in input data.',
                errors: [
                    { path: 'title', message: 'Too short' },
                ],
            });
            expect(mockNoteService.createNote).not.toHaveBeenCalled();
        });

        test('returns 500 on unexpected service error', async () => {
            const serviceError = new Error('DB connection failed');
            mockOrderSchema.parse.mockImplementation(() => { throw new ZodError([{ path: ['items'], message: 'Not an order' }]); });
            mockNoteSchema.parse.mockImplementation(() => { throw serviceError; });
            
            const req = mockReq({ body: {} });
            const res = mockRes();

            await createNote(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error during creation.' });
        });
    });

    // PUT /api/notes/:id
    describe('updateNote', () => {
        const UPDATE_BODY = { title: 'Updated Title', content: 'Updated content' };

        test('updates a regular note and returns 200', async () => {
            mockNoteService.getNoteById.mockResolvedValue(REGULAR_NOTE);
            mockNoteSchema.parse.mockReturnValue(UPDATE_BODY);
            mockNoteService.updateNote.mockResolvedValue({ changes: 1 });
            
            const req = mockReq({ params: { id: NOTE_ID }, body: UPDATE_BODY });
            const res = mockRes();

            await updateNote(req, res);

            expect(mockOrderUtils.isOrderNote).toHaveBeenCalledWith(REGULAR_NOTE.content);
            expect(mockNoteService.updateNote).toHaveBeenCalledWith(NOTE_ID, USER_ID, UPDATE_BODY);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'Note successfully updated.' });
        });

        test('returns 403 if note is an order', async () => {
            mockNoteService.getNoteById.mockResolvedValue(ORDER_NOTE);
            mockOrderUtils.isOrderNote.mockReturnValue(true);
            
            const req = mockReq({ params: { id: ORDER_NOTE.id }, body: UPDATE_BODY });
            const res = mockRes();

            await updateNote(req, res);

            expect(mockOrderUtils.isOrderNote).toHaveBeenCalledWith(ORDER_NOTE.content);
            expect(mockNoteService.updateNote).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Forbidden: This record is a financial order and cannot be updated via the note endpoint.',
            });
        });

        test('returns 404 if note not found', async () => {
            mockNoteService.getNoteById.mockResolvedValue(null);
            
            const req = mockReq({ params: { id: 999 }, body: UPDATE_BODY });
            const res = mockRes();

            await updateNote(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Note not found or you do not own it.' });
        });

        test('returns 400 on Zod validation error', async () => {
            mockNoteService.getNoteById.mockResolvedValue(REGULAR_NOTE);
            const zodError = new ZodError([{ path: ['title'], message: 'Too short' }]);
            mockNoteSchema.parse.mockImplementation(() => { throw zodError; });
            
            const req = mockReq({ params: { id: NOTE_ID }, body: { title: 'a' } });
            const res = mockRes();

            await updateNote(req, res);

            expect(mockNoteService.updateNote).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Validation error in input data.',
                errors: [{ path: 'title', message: 'Too short' }],
            });
        });
        
        test('returns 500 on unexpected service error', async () => {
            mockNoteService.getNoteById.mockResolvedValue(REGULAR_NOTE);
            mockNoteSchema.parse.mockReturnValue(UPDATE_BODY);
            const serviceError = new Error('Update failed');
            mockNoteService.updateNote.mockRejectedValue(serviceError);
            
            const req = mockReq({ params: { id: NOTE_ID }, body: UPDATE_BODY });
            const res = mockRes();

            await updateNote(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error.' });
        });
    });

    // DELETE /api/notes/:id
    describe('deleteNote', () => {
        test('deletes a regular note and returns 204', async () => {
            mockNoteService.getNoteById.mockResolvedValue(REGULAR_NOTE);
            mockNoteService.deleteNote.mockResolvedValue({ changes: 1 });
            
            const req = mockReq({ params: { id: NOTE_ID } });
            const res = mockRes();

            await deleteNote(req, res);

            expect(mockNoteService.getNoteById).toHaveBeenCalledWith(NOTE_ID, USER_ID);
            expect(mockNoteService.deleteNote).toHaveBeenCalledWith(NOTE_ID, USER_ID);
            expect(res.status).toHaveBeenCalledWith(204);
            expect(res.send).toHaveBeenCalled();
        });

        test('returns 404 if note not found or not owned', async () => {
            mockNoteService.getNoteById.mockResolvedValue(null);
            
            const req = mockReq({ params: { id: 999 } });
            const res = mockRes();

            await deleteNote(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Note not found or you do not own it.' });
        });

        test('returns 403 if note is an order', async () => {
            mockNoteService.getNoteById.mockResolvedValue(ORDER_NOTE);
            mockOrderUtils.isOrderNote.mockReturnValue(true);
            
            const req = mockReq({ params: { id: ORDER_NOTE.id } });
            const res = mockRes();

            await deleteNote(req, res);

            expect(mockOrderUtils.isOrderNote).toHaveBeenCalledWith(ORDER_NOTE.content);
            expect(mockNoteService.deleteNote).not.toHaveBeenCalled();
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Forbidden: This record is a financial order and cannot be deleted via the note endpoint.',
            });
        });

        test('returns 500 on service error', async () => {
            mockNoteService.getNoteById.mockResolvedValue(REGULAR_NOTE);
            const serviceError = new Error('Delete failed');
            mockNoteService.deleteNote.mockRejectedValue(serviceError);

            const req = mockReq({ params: { id: NOTE_ID } });
            const res = mockRes();

            await deleteNote(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error.' });
        });
    });
});
