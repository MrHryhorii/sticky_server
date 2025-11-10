import * as userService from '../services/user_service.js';
import * as noteService from '../services/note_service.js'; 

const DEFAULT_LIMIT = 20;

// Helper to check for admin role
export const checkAdminRole = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: Admin access required.' });
    }
    next();
}

// Helper function to generate pagination links
const generatePaginationLinks = (baseUrl, page, limit, totalCount) => {
    const totalPages = Math.ceil(totalCount / limit);
    const nextPage = page < totalPages ? page + 1 : null;
    const prevPage = page > 1 ? page - 1 : null;

    const links = {};
    if (prevPage) {
        links.prev = `${baseUrl}?page=${prevPage}&limit=${limit}`;
    }
    if (nextPage) {
        links.next = `${baseUrl}?page=${nextPage}&limit=${limit}`;
    }
    links.first = `${baseUrl}?page=1&limit=${limit}`;
    links.last = `${baseUrl}?page=${totalPages}&limit=${limit}`;

    return {
        currentPage: page,
        totalPages: totalPages,
        totalItems: totalCount,
        links: links,
    };
};

// Gets a list of all users with pagination (GET /api/admin/users)
export const listUsers = async (req, res) => {
    try {
        
        const page = parseInt(req.query.page) > 0 ? parseInt(req.query.page) : 1;
        const limit = parseInt(req.query.limit) > 0 ? parseInt(req.query.limit) : DEFAULT_LIMIT;
        const offset = (page - 1) * limit;

        const { users, totalCount } = await userService.getAllUsers(limit, offset);

        const meta = generatePaginationLinks(
            `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}`, 
            page, 
            limit, 
            totalCount
        );
        return res.status(200).json({
            status: 'success',
            meta: meta,
            data: users,
        });

    } catch (error) {
        console.error('Error listing users:', error);
        return res.status(500).json({ message: 'Internal server error during user listing.' });
    }
};

// Handles user deletion (DELETE /api/admin/users/:id)
export const deleteUser = async (req, res) => {
    try {
        
        const userId = parseInt(req.params.id);
        
        // Prevent admin from deleting their own account
        if (req.user.id === userId) {
            return res.status(403).json({ message: 'You cannot delete your own account via this admin route.' });
        }

        const success = await userService.deleteUser(userId); 
        if (!success) {
            return res.status(404).json({ message: 'User not found.' });
        }
        return res.status(204).send();

    } catch (error) {
        console.error('Error deleting user:', error);
        return res.status(500).json({ message: 'Internal server error during user deletion.' });
    }
};

// Gets a list of all notes with pagination (GET /api/admin/notes)
export const listAllNotes = async (req, res) => {
    try {
        
        const page = parseInt(req.query.page) > 0 ? parseInt(req.query.page) : 1;
        const limit = parseInt(req.query.limit) > 0 ? parseInt(req.query.limit) : DEFAULT_LIMIT;
        const offset = (page - 1) * limit;

        const { notes, totalCount } = await noteService.adminGetAllNotes(limit, offset);
        
        const meta = generatePaginationLinks(
            `${req.protocol}://${req.get('host')}${req.baseUrl}${req.path}`, 
            page, 
            limit, 
            totalCount
        );
        return res.status(200).json({
            status: 'success',
            meta: meta,
            data: notes,
        });

    } catch (error) {
        console.error('Error listing all notes:', error);
        return res.status(500).json({ message: 'Internal server error during note listing.' });
    }
};

// Handles note deletion (DELETE /api/admin/notes/:id)
export const deleteNote = async (req, res) => {
    try {
        
        const noteId = parseInt(req.params.id);
        const success = await noteService.adminDeleteNote(noteId); 
        if (!success) {
            return res.status(404).json({ message: 'Note not found.' });
        }
        return res.status(204).send();

    } catch (error) {
        console.error('Error deleting note:', error);
        return res.status(500).json({ message: 'Internal server error during note deletion.' });
    }
};