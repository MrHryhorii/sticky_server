import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

// Middleware to verify JWT and attach user data (id, username) to request object (req.user).
export const protect = (req, res, next) => {
    let token;

    // Expected header format: Authorization: Bearer <token>
    const authHeader = req.headers.authorization;
    // Check if header exists and starts with 'Bearer '
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // 401 Unauthorized: No token found or bad format
        return res.status(401).json({ message: 'Not authorized, token missing or invalid format.' });
    }
    // Extract the token part
    token = authHeader.split(' ')[1];

    try {
        // Verify token against the secret key
        const decoded = jwt.verify(token, JWT_SECRET); // Throws error if token is expired/invalid
        // Attach user ID and username from the token payload to the request object
        // This data (req.user) will be used by the notes controller to ensure ownership.
        req.user = decoded; 
        // Proceed to the next middleware or controller function
        next();
    } catch (error) {
        // 401 Unauthorized: Verification failed
        console.error('JWT verification error:', error.message);
        return res.status(401).json({ message: 'Not authorized, token failed.' });
    }
};