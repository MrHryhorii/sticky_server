import { z } from 'zod';

// Base Schema for user credentials
const AuthSchema = z.object({
    // Username must be a string, minimum 3 chars, max 20 chars
    username: z.string()
        .min(3, "Username must be at least 3 characters.")
        .max(20, "Username cannot exceed 20 characters."),
        
    // Password must be a string, minimum 6 chars, max 20 chars
    password: z.string()
        .min(6, "Password must be at least 6 characters.")
        .max(20, "Password cannot exceed 20 characters."),
});

// For registration, we use the base schema
export const RegisterSchema = AuthSchema;

// For login, we also use the base schema
export const LoginSchema = AuthSchema;