import * as UserService from '../services/user_service.js';
import bcrypt from 'bcryptjs';
import * as db from '../data/db_adapter.js';

// Mock bcryptjs
// hash always returns the same value
// compare returns false only for "incorrect_password"
jest.mock('bcryptjs', () => ({
    hash: jest.fn(() => 'hashed_password_123'),
    compare: jest.fn((password) => password !== 'incorrect_password'),
}));

// Mock the database module
jest.mock('../data/db_adapter.js');

// Tests for UserService
describe('UserService', () => {

    // Reset mocks before each test
    beforeEach(() => {
        jest.clearAllMocks();
    });

    // registerUser
    describe('registerUser', () => {

        test('registers the first user as admin', async () => {
            // db.get: first = user not found, second = 0 users total
            db.get.mockResolvedValueOnce(null).mockResolvedValueOnce({ count: 0 });
            db.run.mockResolvedValue(1);

            const userId = await UserService.registerUser('firstAdmin', 'password');

            expect(db.get).toHaveBeenCalledTimes(2);
            expect(bcrypt.hash).toHaveBeenCalledWith('password', 10);
            expect(db.run).toHaveBeenCalledWith(
                expect.any(String),
                ['firstAdmin', 'hashed_password_123', 'admin']
            );
            expect(userId).toBe(1);
        });

        test('registers other users with user role', async () => {
            db.get.mockResolvedValueOnce(null).mockResolvedValueOnce({ count: 5 });
            db.run.mockResolvedValue(2);

            const userId = await UserService.registerUser('regularUser', 'password');

            expect(db.get).toHaveBeenCalledTimes(2);
            expect(db.run).toHaveBeenCalledWith(
                expect.any(String),
                ['regularUser', 'hashed_password_123', 'user']
            );
            expect(userId).toBe(2);
        });
        
        test('returns null if username already exists', async () => {
            db.get.mockResolvedValueOnce({ id: 1, username: 'exists' });
            
            const userId = await UserService.registerUser('exists', 'password');

            expect(db.run).not.toHaveBeenCalled();
            expect(bcrypt.hash).not.toHaveBeenCalled();
            expect(userId).toBeNull();
        });
    });

    // authenticateUser
    describe('authenticateUser', () => {
        const mockUser = {
            id: 1,
            username: 'testuser',
            password_hash: 'hashed_password_123',
            role: 'user',
            created_at: 'timestamp'
        };

        test('returns public user data on success', async () => {
            db.get.mockResolvedValueOnce(mockUser);
            
            const result = await UserService.authenticateUser('testuser', 'password');

            expect(bcrypt.compare).toHaveBeenCalledTimes(1);
            expect(result).toEqual({ 
                id: 1,
                username: 'testuser',
                role: 'user',
                created_at: 'timestamp'
            });
            expect(result.password_hash).toBeUndefined();
        });

        test('returns null if user is not found', async () => {
            db.get.mockResolvedValueOnce(null);
            
            const result = await UserService.authenticateUser('nonexistent', 'password');

            expect(bcrypt.compare).not.toHaveBeenCalled();
            expect(result).toBeNull();
        });

        test('returns null if password is wrong', async () => {
            db.get.mockResolvedValueOnce(mockUser);
            
            const result = await UserService.authenticateUser('testuser', 'incorrect_password');

            expect(bcrypt.compare).toHaveBeenCalledTimes(1);
            expect(result).toBeNull();
        });
    });
    
    // deleteUser
    describe('deleteUser', () => {
        test('returns true when user is deleted', async () => {
            db.get.mockResolvedValueOnce({ id: 5 });
            db.run.mockResolvedValue(1);
            
            const success = await UserService.deleteUser(5);

            expect(db.get).toHaveBeenCalledTimes(1);
            expect(db.run).toHaveBeenCalledTimes(1);
            expect(db.run).toHaveBeenCalledWith('DELETE FROM users WHERE id = ?', [5]);
            expect(success).toBe(true);
        });

        test('returns false if user not found', async () => {
            db.get.mockResolvedValueOnce(null);
            
            const success = await UserService.deleteUser(999);

            expect(db.run).not.toHaveBeenCalled();
            expect(success).toBe(false);
        });
    });
});