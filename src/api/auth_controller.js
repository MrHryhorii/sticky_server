import jwt from 'jsonwebtoken';
import * as userService from '../services/user_service.js';
import { RegisterSchema, LoginSchema } from '../schemas/auth_schema.js';

// Get a secret key from .env
const JWT_SECRET = process.env.JWT_SECRET;

// Generates a JWT for the authenticated user
const generateToken = (user) => {
    return jwt.sign({ 
        id: user.id, 
        username: user.username, 
        role: user.role
    }, JWT_SECRET, {
        expiresIn: '1d', // when it expires
   });
};

// Handles user registration (POST /api/auth/register)
export const register = async (req, res) => {
    try {
        // Zod Validation
        const validatedData = RegisterSchema.parse(req.body);
        const { username, password } = validatedData;
        // Service Call
        const userId = await userService.registerUser(username, password);
        if (userId === null) {
            // User already exists
            return res.status(409).json({ message: 'User with this username already exists.' });
        }
        // Success
        return res.status(201).json({ 
            message: 'User registered successfully.', 
            userId: userId 
        });

    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ 
                message: 'Validation error in input data.', 
                errors: error.issues.map(issue => ({ path: issue.path[0], message: issue.message })) 
            });
        }
        console.error('Registration error:', error);
        return res.status(500).json({ message: 'Internal server error during registration.' });
    }
};

// Handles user login (POST /api/auth/login) and JWT issuance
export const login = async (req, res) => {
    try {
        // Zod Validation
        const validatedData = LoginSchema.parse(req.body);
        const { username, password } = validatedData;
        // Service Call
        const user = await userService.authenticateUser(username, password);
        if (!user) {
            // 401 Unauthorized
            return res.status(401).json({ message: 'Invalid username or password.' });
        }
        // JWT Generation
        const token = generateToken(user);
        // Success
        return res.status(200).json({ 
            message: 'Login successful.', 
            token: token,
            user: { id: user.id, username: user.username, role: user.role }
        });

    } catch (error) {
        if (error.name === 'ZodError') {
            return res.status(400).json({ 
                message: 'Validation error in input data.', 
                errors: error.issues.map(issue => ({ path: issue.path[0], message: issue.message })) 
            });
        }
        console.error('Login error:', error);
        return res.status(500).json({ message: 'Internal server error during login.' });
    }
};

// Gets the user's info
export const getMe = async (req, res) => {
    // Success
    if (req.user) {
        return res.status(200).json(req.user);
    } else {
        // Error
        return res.status(401).json({ message: 'User not authenticated.' });
    }
};

// Handles user logout (POST /api/auth/logout)
export const logout = (req, res) => {
    return res.status(200).json({ 
        message: 'Logout successful. Token must be deleted on the client side.' 
    });
};

// Allows an authenticated user to delete their own account (DELETE /api/auth/delete-account)
export const deleteSelf = async (req, res, next) => {
    const userId = req.user.id;

    // Admin can not delete own accaunt
    if (req.user.role === 'admin') {
         // 403 Forbidden
         return res.status(403).json({ 
             message: 'Admin accounts cannot be deleted via the self-deletion route for security reasons.' 
         });
    }

    const success = await userService.deleteOwnAccount(userId);
    if (!success) {
        return res.status(404).json({ message: 'User not found.' });
    }
    return res.status(204).send();
};