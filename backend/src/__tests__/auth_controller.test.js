import { register, login, getMe, logout, deleteSelf } from '../api/auth_controller.js';
import * as userService from '../services/user_service.js';

// Mock dependencies
jest.mock('../services/user_service.js');
// Mock jwt used in generateToken
jest.mock('jsonwebtoken', () => ({
    sign: jest.fn(() => 'mocked.jwt.token')
}));
// Mock validation schemas
jest.mock('../schemas/auth_schema.js', () => ({
    // pretend Zod validation passes by returning the input
    RegisterSchema: { parse: jest.fn(data => data) },
    LoginSchema: { parse: jest.fn(data => data) }
}));

const USER_ID = 1;
const USERNAME = 'testuser';
const PASSWORD = 'password123';
const MOCK_USER = { id: USER_ID, username: USERNAME, role: 'user' };
const MOCK_ADMIN = { id: 2, username: 'adminuser', role: 'admin' };

const mockResponse = () => {
    const res = {};
    res.status = jest.fn().mockReturnThis();
    res.json = jest.fn().mockReturnThis();
    res.send = jest.fn().mockReturnThis();
    return res;
};


// Tests for register (POST /api/auth/register)
describe('Auth Controller: register', () => {
    const req = { body: { username: USERNAME, password: PASSWORD } };
    let res;

    beforeEach(() => {
        res = mockResponse();
        jest.clearAllMocks();
    });

    test('registers a user and returns 201', async () => {
        userService.registerUser.mockResolvedValue(USER_ID);

        await register(req, res);

        expect(userService.registerUser).toHaveBeenCalledWith(USERNAME, PASSWORD);
        expect(res.status).toHaveBeenCalledWith(201);
        expect(res.json).toHaveBeenCalledWith({
            message: 'User registered successfully.',
            userId: USER_ID
        });
    });

    test('returns 409 if username already taken', async () => {
        userService.registerUser.mockResolvedValue(null);

        await register(req, res);

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith({ message: 'User with this username already exists.' });
    });

    test('returns 400 if validation fails', async () => {
        const mockError = { name: 'ZodError', issues: [{ path: ['username'], message: 'Too short' }] };
        require('../schemas/auth_schema.js').RegisterSchema.parse.mockImplementation(() => { throw mockError; });

        await register(req, res);

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: 'Validation error in input data.',
            })
        );
    });
});


// Tests for login (POST /api/auth/login)
describe('Auth Controller: login', () => {
    const req = { body: { username: USERNAME, password: PASSWORD } };
    let res;

    beforeEach(() => {
        res = mockResponse();
        jest.clearAllMocks();
    });

    test('logs in a user and returns token', async () => {
        userService.authenticateUser.mockResolvedValue(MOCK_USER);

        await login(req, res);

        expect(userService.authenticateUser).toHaveBeenCalledWith(USERNAME, PASSWORD);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                message: 'Login successful.',
                token: 'mocked.jwt.token',
                user: MOCK_USER
            })
        );
    });

    test('returns 401 for invalid credentials', async () => {
        userService.authenticateUser.mockResolvedValue(null);

        await login(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'Invalid username or password.' });
    });
});


// Tests for getMe (GET /api/auth/me)
describe('Auth Controller: getMe', () => {
    let res;

    beforeEach(() => {
        res = mockResponse();
        jest.clearAllMocks();
    });

    test('returns 200 and user data when authenticated', async () => {
        const req = { user: MOCK_USER };

        await getMe(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith(MOCK_USER);
    });

    test('returns 401 if not authenticated', async () => {
        const req = { user: undefined };

        await getMe(req, res);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ message: 'User not authenticated.' });
    });
});

// Tests for logout (POST /api/auth/logout)
describe('Auth Controller: logout', () => {
    let res;

    beforeEach(() => {
        res = mockResponse();
        jest.clearAllMocks();
    });

    test('returns 200 with logout message', async () => {
        const req = {};

        await logout(req, res);

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Logout successful. Token must be deleted on the client side.'
        });
    });
});

// Tests for deleteSelf (DELETE /api/auth/delete-account)
describe('Auth Controller: deleteSelf', () => {
    let res;
    const next = jest.fn();

    beforeEach(() => {
        res = mockResponse();
        jest.clearAllMocks();
    });

    test('deletes own account and returns 204 for normal user', async () => {
        const req = { user: MOCK_USER };
        userService.deleteOwnAccount.mockResolvedValue(true);

        await deleteSelf(req, res, next);

        expect(userService.deleteOwnAccount).toHaveBeenCalledWith(USER_ID);
        expect(res.status).toHaveBeenCalledWith(204);
        expect(res.send).toHaveBeenCalled();
    });

    test('returns 403 when admin tries to delete via self route', async () => {
        const req = { user: MOCK_ADMIN };

        await deleteSelf(req, res, next);

        expect(userService.deleteOwnAccount).not.toHaveBeenCalled();
        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({
            message: 'Admin accounts cannot be deleted via the self-deletion route for security reasons.'
        });
    });

    test('returns 404 if deletion failed / user not found', async () => {
        const req = { user: MOCK_USER };
        userService.deleteOwnAccount.mockResolvedValue(false);

        await deleteSelf(req, res, next);

        expect(userService.deleteOwnAccount).toHaveBeenCalledWith(USER_ID);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ message: 'User not found.' });
    });
});