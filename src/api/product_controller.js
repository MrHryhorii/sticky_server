import * as productService from '../services/product_service.js';
import { productSchema } from '../schemas/product_schema.js';

// Middleware to ensure the user has 'admin' role
const checkAdminRole = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: Admin access required.' });
    }
    next();
};

// PUBLIC MENU FUNCTIONS

// Gets all active products for the public menu view (GET /api/products)
export const listActiveProducts = async (req, res) => {
    try {
        const products = await productService.getActiveProducts();
        return res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching public menu:', error);
        return res.status(500).json({ message: 'Internal server error while fetching products.' });
    }
};


// ADMIN CRUD FUNCTIONS

// Gets ALL products (GET /api/admin/products)
export const listAllProductsAdmin = async (req, res) => {
    try {
        const products = await productService.getAllProductsAdmin();
        return res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching admin products:', error);
        return res.status(500).json({ message: 'Internal server error while fetching all products.' });
    }
};

// Creates a new product (POST /api/admin/products)
export const createProduct = async (req, res) => {
    try {
        // Validation using Zod
        const productData = productSchema.parse(req.body);
        const adminId = req.user.id;
        
        const newId = await productService.createProduct(adminId, productData);
        
        return res.status(201).json({ 
            id: newId, 
            message: 'Product created successfully.', 
            ...productData 
        });
    } catch (error) {
        if (error.name === 'ZodError') {
             return res.status(400).json({ message: 'Validation failed.', errors: error.errors });
        }
        console.error('Error creating product:', error);
        return res.status(500).json({ message: 'Internal server error during product creation.' });
    }
};

// Updates a product(PUT /api/admin/products/:id)
export const updateProduct = async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        const productData = productSchema.partial().parse(req.body); 

        if (Object.keys(productData).length === 0) {
            return res.status(400).json({ message: 'No fields provided for update.' });
        }
        
        const success = await productService.updateProduct(productId, productData);

        if (!success) {
            return res.status(404).json({ message: 'Product not found.' });
        }
        
        return res.status(200).json({ message: 'Product updated successfully.' });
    } catch (error) {
        if (error.name === 'ZodError') {
             return res.status(400).json({ message: 'Validation failed.', errors: error.errors });
        }
        console.error('Error updating product:', error);
        return res.status(500).json({ message: 'Internal server error during product update.' });
    }
};

// Deletes a product (DELETE /api/admin/products/:id)
export const deleteProduct = async (req, res) => {
    try {
        const productId = parseInt(req.params.id);
        const success = await productService.deleteProduct(productId);
        
        if (!success) {
            return res.status(404).json({ message: 'Product not found.' });
        }
        return res.status(204).send(); 
    } catch (error) {
        console.error('Error deleting product:', error);
        return res.status(500).json({ message: 'Internal server error during product deletion.' });
    }
};

// Export the admin role checker
export { checkAdminRole };