import * as ProductService from '../services/product_service.js';
import * as db from '../data/db_adapter.js';

// Mock the DB adapter
jest.mock('../data/db_adapter.js');

const ADMIN_ID = 1;

// Sample products
const PRODUCT_1_ACTIVE = { id: 101, name: 'Pizza', price: 15.00, is_active: 1 };
const PRODUCT_2_INACTIVE = { id: 102, name: 'Cake', price: 5.00, is_active: 0 };
const ALL_PRODUCTS = [PRODUCT_1_ACTIVE, PRODUCT_2_INACTIVE];
const ACTIVE_PRODUCTS = [PRODUCT_1_ACTIVE];

describe('ProductService', () => {

    beforeEach(() => {
        // reset mocks before each test
        jest.clearAllMocks();
    });

    // getActiveProducts
    describe('getActiveProducts', () => {
        test('returns only active products', async () => {
            db.all.mockResolvedValue(ACTIVE_PRODUCTS); 
            
            const result = await ProductService.getActiveProducts();

            // query should filter by is_active = 1
            expect(db.all).toHaveBeenCalledWith(expect.stringContaining('WHERE is_active = 1'));
            expect(result).toEqual(ACTIVE_PRODUCTS);
        });
    });

    // getAllProductsAdmin
    describe('getAllProductsAdmin', () => {
        test('returns all products for admin', async () => {
            db.all.mockResolvedValue(ALL_PRODUCTS); 
            
            const result = await ProductService.getAllProductsAdmin();

            // should select all products
            expect(db.all).toHaveBeenCalledWith(expect.stringContaining('SELECT * FROM products'));
            expect(result).toEqual(ALL_PRODUCTS);
        });
    });
    
    // createProduct
    describe('createProduct', () => {
        test('creates a product and returns the new ID', async () => {
            db.run.mockResolvedValue(200); 
            
            const newProductData = {
                name: 'New Sandwich', 
                price: 10.50, 
                category: 'Food',
                is_active: true
            };

            const result = await ProductService.createProduct(ADMIN_ID, newProductData);

            expect(db.run).toHaveBeenCalledTimes(1);
            // check all values passed to INSERT (null defaults included)
            expect(db.run).toHaveBeenCalledWith(
                expect.any(String), 
                [
                    'New Sandwich', 
                    null,       // description (default)
                    10.50,
                    'Food',
                    null,       // tags
                    null,       // extra_info
                    null,       // image_url
                    1,          // is_active
                    ADMIN_ID    // created_by_id
                ]
            );
            expect(result).toBe(200);
        });
    });
    
    // updateProduct
    describe('updateProduct', () => {
        test('handles full update (multiple fields)', async () => {
            db.run.mockResolvedValue(1); 
            const payload = { name: 'New Name', price: 99.99, is_active: false };
            
            const success = await ProductService.updateProduct(101, payload);

            expect(success).toBe(true);
            
            const sqlArgs = db.run.mock.calls[0];
            // dynamic SQL should update name, price, is_active and set updated_at
            expect(sqlArgs[0]).toEqual(expect.stringContaining('SET name = ?, price = ?, is_active = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'));
            
            // args should match converted values
            expect(sqlArgs[1]).toEqual([
                'New Name',
                99.99,
                0, // false
                101
            ]);
        });

        test('handles partial update (one field)', async () => {
            db.run.mockResolvedValue(1); 
            const payload = { description: 'New description only' };
            
            await ProductService.updateProduct(101, payload);

            const sqlArgs = db.run.mock.calls[0];
            // SQL should update only description and updated_at
            expect(sqlArgs[0]).toEqual(expect.stringContaining('SET description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?'));
        });

        test('returns true if no fields provided (nothing to do)', async () => {
            const payload = {};
            const success = await ProductService.updateProduct(101, payload);
            // db.run should not be called
            expect(db.run).toHaveBeenCalledTimes(0);
            expect(success).toBe(true);
        });
        
        test('returns false if product not found (0 rows)', async () => {
            db.run.mockResolvedValue(0); 
            const payload = { name: 'Non-existent' };
            const success = await ProductService.updateProduct(999, payload);
            expect(success).toBe(false);
        });
    });

    // deleteProduct
    describe('deleteProduct', () => {
        test('returns true on successful delete', async () => {
            db.run.mockResolvedValue(1); 
            const success = await ProductService.deleteProduct(101);
            expect(db.run).toHaveBeenCalledWith('DELETE FROM products WHERE id = ?', [101]);
            expect(success).toBe(true);
        });
    });
    
    // getProductById
    describe('getProductById', () => {
        test('returns product when found', async () => {
            db.get.mockResolvedValue(PRODUCT_1_ACTIVE);
            const result = await ProductService.getProductById(101);
            expect(result).toEqual(PRODUCT_1_ACTIVE);
        });
        
        test('returns null when not found', async () => {
            db.get.mockResolvedValue(null);
            const result = await ProductService.getProductById(999);
            expect(result).toBeNull();
        });
    });
});
