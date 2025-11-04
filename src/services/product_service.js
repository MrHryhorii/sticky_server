import * as db from '../data/db_adapter.js';

// PUBLIC ACCESS

// Gets all active products
export async function getActiveProducts() {
    return db.all(
        // Include all display-related fields
        `SELECT id, name, description, price, category, tags, extra_info, image_url 
         FROM products 
         WHERE is_active = 1 
         ORDER BY name ASC`
    );
}

// ADMIN ACCESS

// Gets all products
export async function getAllProductsAdmin() {
    // Select all fields for admin view
    return db.all('SELECT * FROM products ORDER BY created_at DESC');
}

// Creates a new product, restricted to admin
export async function createProduct(adminId, { name, description, price, category, tags, extra_info, image_url, is_active = true }) {
    const lastID = await db.run(
        `INSERT INTO products 
         (name, description, price, category, tags, extra_info, image_url, is_active, created_by_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [name, description, price, category || null, tags || null, extra_info || null, image_url || null, is_active ? 1 : 0, adminId]
    );
    return lastID;
}

// Updates a product
export async function updateProduct(productId, { name, description, price, category, tags, extra_info, image_url, is_active }) {
    const changes = [];
    const values = [];

    // Dynamically build the UPDATE query based on provided fields
    if (name !== undefined) { changes.push('name = ?'); values.push(name); }
    if (description !== undefined) { changes.push('description = ?'); values.push(description); }
    if (price !== undefined) { changes.push('price = ?'); values.push(price); }
    if (category !== undefined) { changes.push('category = ?'); values.push(category); }
    if (tags !== undefined) { changes.push('tags = ?'); values.push(tags); }
    if (extra_info !== undefined) { changes.push('extra_info = ?'); values.push(extra_info); }
    if (image_url !== undefined) { changes.push('image_url = ?'); values.push(image_url); }
    if (is_active !== undefined) { changes.push('is_active = ?'); values.push(is_active ? 1 : 0); }

    if (changes.length === 0) return true; // No fields to update

    const sql = `UPDATE products SET ${changes.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`;
    values.push(productId);
    
    const affectedRows = await db.run(sql, values);
    // Returns true/false if rows are affected
    return affectedRows > 0; 
}

// Deletes a product from the database
export async function deleteProduct(productId) {
    const affectedRows = await db.run('DELETE FROM products WHERE id = ?', [productId]);
    // Returns true/false if rows are affected
    return affectedRows > 0;
}

// Retrieves a single product by ID
export async function getProductById(productId) {
    return db.get(
        `SELECT id, name, price, is_active 
         FROM products 
         WHERE id = ?`, 
        [productId]
    );
}