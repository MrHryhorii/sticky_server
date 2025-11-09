// Admin check middleware
export const checkAdminRole = (req, res, next) => { 
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden: Admin access required.' });
    }
    next();
};

// Public menu endpoints

// GET /api/products - public active products
export const listActiveProducts = async (req, res) => {
    try {
        const productService = await import('../services/product_service.js');
        const products = await productService.getActiveProducts();
        return res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching public menu:', error);
        return res.status(500).json({ message: 'Internal server error while fetching products.' });
    }
};

// GET /api/products/:id - single active product
export const getSingleActiveProduct = async (req, res) => {
    try {
        const productService = await import('../services/product_service.js');
        const productId = parseInt(req.params.id);
        const product = await productService.getProductById(productId);
        
        if (!product || product.is_active === 0) {
            return res.status(404).json({ message: 'Product not found.' });
        }

        return res.status(200).json(product);
    } catch (error) {
        console.error('Error fetching single active product:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};

// Admin CRUD endpoints

// GET /api/admin/products - all products for admin
export const listAllProductsAdmin = async (req, res) => {
    try {
        const productService = await import('../services/product_service.js');
        const products = await productService.getAllProductsAdmin();
        return res.status(200).json(products);
    } catch (error) {
        console.error('Error fetching admin products:', error);
        return res.status(500).json({ message: 'Internal server error while fetching all products.' });
    }
};

// GET /api/admin/products/:id - admin view of single product
export const getSingleProductAdmin = async (req, res) => {
    try {
        const productService = await import('../services/product_service.js');
        const productId = parseInt(req.params.id);
        const product = await productService.getProductById(productId);
        if (!product) {
            return res.status(404).json({ message: 'Product not found.' });
        }
        
        return res.status(200).json(product);
    } catch (error) {
        console.error('Error fetching single product for admin:', error);
        return res.status(500).json({ message: 'Internal server error.' });
    }
};

// POST /api/admin/products - create product
export const createProduct = async (req, res) => {
    try {
        const productService = await import('../services/product_service.js');
        const { productSchema } = await import('../schemas/product_schema.js');

        // validate body
        const productData = productSchema.parse(req.body); 
        const adminId = req.user.id;
        
        const newId = await productService.createProduct(adminId, productData);
        
        // return created id and data
        return res.status(201).json({ 
            id: newId, 
            message: 'Product created successfully.', 
            ...productData 
        });

    } catch (error) {
        // validation error from Zod
        if (error.name === 'ZodError') {
             return res.status(400).json({ message: 'Validation failed.', errors: error.issues });
        }
        console.error('Error creating product:', error);
        return res.status(500).json({ message: 'Internal server error during product creation.' });
    }
};

// PUT /api/admin/products/:id - update product
export const updateProduct = async (req, res) => {
    try {
        const productService = await import('../services/product_service.js');
        const { productSchema } = await import('../schemas/product_schema.js');

        const productId = parseInt(req.params.id);
        // validate partial update
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
             return res.status(400).json({ message: 'Validation failed.', errors: error.issues });
        }
        console.error('Error updating product:', error);
        return res.status(500).json({ message: 'Internal server error during product update.' });
    }
};

// DELETE /api/admin/products/:id - remove product
export const deleteProduct = async (req, res) => {
    try {
        const productService = await import('../services/product_service.js');
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
