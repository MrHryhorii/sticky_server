import { z } from 'zod';

// Schema for note creation and update
export const NoteSchema = z.object({
    title: z.string()
        .min(1, 'Title cannot be empty.')
        .max(100, 'Title cannot exceed 100 characters.'),
        
    // Content is optional for a note, but has a max length
    content: z.string()
        .max(5000, 'Content cannot exceed 5000 characters.')
        .optional()
});