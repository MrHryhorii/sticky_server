import 'dotenv/config';
import express from 'express';
import * as db from './data/db_adapter.js';
import authRoutes from './api/auth_routes.js';
import noteRoutes from './api/note_routes.js';
import adminRoutes from './api/admin_routes.js';
import orderRoutes from './api/order_routes.js';
import productRoutes from './api/product_routes.js';
import adminProductRoutes from './api/admin_product_routes.js'

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse incoming JSON request bodies
app.use(express.json());

// Basic health check endpoint
app.get('/', (req, res) => {
    res.status(200).send('Notes API Service is running!');
});

// ROUTE HANDLER
app.use('/api/auth', authRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);
app.use('/api/admin/products', adminProductRoutes);

// Start DB connection and then launch the server
db.initDb() // This function connects to SQLite and creates tables
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server listening on port ${PORT}`);
            console.log(`Open http://localhost:${PORT}`);
        });
    })
    .catch(err => {
        console.error('Failed to start application due to DB error:', err);
        // Exit the process if the database connection fails
        process.exit(1);
    });