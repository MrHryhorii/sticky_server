var mockGetActiveProducts = jest.fn();
var mockGetProductById = jest.fn();
var mockGetAllProductsAdmin = jest.fn();
var mockCreateProduct = jest.fn();
var mockUpdateProduct = jest.fn();
var mockDeleteProduct = jest.fn();

// Zod mocks
var mockProductSchemaParse = jest.fn();
var mockProductSchemaPartialParse = jest.fn(); 

// Mock modules
jest.mock('../services/product_service.js', () => ({
    __esModule: true, 
    getActiveProducts: mockGetActiveProducts,
    getProductById: mockGetProductById,
    getAllProductsAdmin: mockGetAllProductsAdmin,
    createProduct: mockCreateProduct,
    updateProduct: mockUpdateProduct,
    deleteProduct: mockDeleteProduct,
}));

jest.mock('../schemas/product_schema.js', () => ({
    productSchema: { 
        parse: mockProductSchemaParse,
        partial: jest.fn(() => ({ parse: mockProductSchemaPartialParse })),
    },
}));


// Imports
import { ZodError } from 'zod'; 
import { 
    checkAdminRole,
    listActiveProducts,
    getSingleActiveProduct,
    listAllProductsAdmin,
    getSingleProductAdmin,
    createProduct,
    updateProduct,
    deleteProduct
} from '../api/product_controller.js';

// Sample data
const ADMIN_USER = { id: 1, role: 'admin' };
const REGULAR_USER = { id: 2, role: 'user' };
const ACTIVE_PRODUCT = { id: 10, name: 'Coffee', price: 5.00, is_active: 1 };
const INACTIVE_PRODUCT = { id: 11, name: 'Outdated Tea', price: 3.00, is_active: 0 };
const ALL_PRODUCTS = [ACTIVE_PRODUCT, INACTIVE_PRODUCT];
const PRODUCT_DATA_VALID = { name: 'Latte', price: 6.00, description: 'New drink' };
const PRODUCT_DATA_UPDATE = { price: 7.00 };
const ZOD_ERROR_DETAILS = [{ path: ['name'], message: 'Required' }];
const ZOD_ERROR = new ZodError(ZOD_ERROR_DETAILS);


// Helpers for req/res/next
const mockReq = (user, body = {}, params = {}) => ({ user, body, params });
const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnThis();
    res.json = jest.fn().mockReturnThis();
    res.send = jest.fn().mockReturnThis();
    return res;
};
const mockNext = jest.fn();

// checkAdminRole middleware tests
describe('checkAdminRole', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    test('should call next() for an admin user', () => {
        const req = mockReq(ADMIN_USER);
        const res = mockRes();

        checkAdminRole(req, res, mockNext);

        expect(res.status).not.toHaveBeenCalled();
        expect(mockNext).toHaveBeenCalledTimes(1);
    });

    test('should return 403 for a regular user', () => {
        const req = mockReq(REGULAR_USER);
        const res = mockRes();

        checkAdminRole(req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden: Admin access required.' });
        // middleware should stop the flow
        expect(mockNext).not.toHaveBeenCalled(); 
    });

    test('should return 403 if req.user is missing', () => {
        const req = mockReq(null);
        const res = mockRes();

        checkAdminRole(req, res, mockNext);

        expect(res.status).toHaveBeenCalledWith(403);
        expect(res.json).toHaveBeenCalledWith({ message: 'Forbidden: Admin access required.' });
        expect(mockNext).not.toHaveBeenCalled();
    });
});

// Public product controllers
describe('PUBLIC Product Controllers', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });

    describe('listActiveProducts', () => {
        test('should return a list of active products and 200', async () => {
            const req = mockReq(REGULAR_USER);
            const res = mockRes();
            mockGetActiveProducts.mockResolvedValue([ACTIVE_PRODUCT]);

            await listActiveProducts(req, res);

            expect(mockGetActiveProducts).toHaveBeenCalledTimes(1);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([ACTIVE_PRODUCT]);
        });

        test('should return 500 on service error', async () => {
            const req = mockReq(REGULAR_USER);
            const res = mockRes();
            const serviceError = new Error('DB Down');
            mockGetActiveProducts.mockRejectedValue(serviceError);

            await listActiveProducts(req, res);

            expect(console.error).toHaveBeenCalledWith('Error fetching public menu:', serviceError);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error while fetching products.' });
        });
    });

    describe('getSingleActiveProduct', () => {
        test('should return a single active product and 200', async () => {
            const req = mockReq(REGULAR_USER, {}, { id: ACTIVE_PRODUCT.id });
            const res = mockRes();
            mockGetProductById.mockResolvedValue(ACTIVE_PRODUCT);

            await getSingleActiveProduct(req, res);

            expect(mockGetProductById).toHaveBeenCalledWith(ACTIVE_PRODUCT.id);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(ACTIVE_PRODUCT);
        });

        test('should return 404 if product is not found', async () => {
            const req = mockReq(REGULAR_USER, {}, { id: 999 });
            const res = mockRes();
            mockGetProductById.mockResolvedValue(null);

            await getSingleActiveProduct(req, res);

            expect(mockGetProductById).toHaveBeenCalledWith(999);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Product not found.' });
        });

        test('should return 404 if product is inactive (is_active === 0)', async () => {
            const req = mockReq(REGULAR_USER, {}, { id: INACTIVE_PRODUCT.id });
            const res = mockRes();
            mockGetProductById.mockResolvedValue(INACTIVE_PRODUCT); 

            await getSingleActiveProduct(req, res);

            expect(mockGetProductById).toHaveBeenCalledWith(INACTIVE_PRODUCT.id);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Product not found.' });
        });

        test('should return 500 on service error', async () => {
            const req = mockReq(REGULAR_USER, {}, { id: ACTIVE_PRODUCT.id });
            const res = mockRes();
            const serviceError = new Error('DB timeout');
            mockGetProductById.mockRejectedValue(serviceError);

            await getSingleActiveProduct(req, res);

            expect(console.error).toHaveBeenCalledWith('Error fetching single active product:', serviceError);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error.' });
        });
    });
});

// Admin CRUD controllers
describe('ADMIN Product Controllers (CRUD)', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });

    // listAllProductsAdmin
    describe('listAllProductsAdmin', () => {
        test('should return all products (active/inactive) and 200', async () => {
            const req = mockReq(ADMIN_USER);
            const res = mockRes();
            mockGetAllProductsAdmin.mockResolvedValue(ALL_PRODUCTS);

            await listAllProductsAdmin(req, res);

            expect(mockGetAllProductsAdmin).toHaveBeenCalledTimes(1);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(ALL_PRODUCTS);
        });

        test('should return 500 on service error', async () => {
            const req = mockReq(ADMIN_USER);
            const res = mockRes();
            const serviceError = new Error('DB Error');
            mockGetAllProductsAdmin.mockRejectedValue(serviceError);

            await listAllProductsAdmin(req, res);

            expect(console.error).toHaveBeenCalledWith('Error fetching admin products:', serviceError);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error while fetching all products.' });
        });
    });

    // getSingleProductAdmin
    describe('getSingleProductAdmin', () => {
        test('should return an inactive product and 200 for admin', async () => {
            const req = mockReq(ADMIN_USER, {}, { id: INACTIVE_PRODUCT.id });
            const res = mockRes();
            mockGetProductById.mockResolvedValue(INACTIVE_PRODUCT);

            await getSingleProductAdmin(req, res);

            expect(mockGetProductById).toHaveBeenCalledWith(INACTIVE_PRODUCT.id);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(INACTIVE_PRODUCT);
        });

        test('should return 404 if product is not found', async () => {
            const req = mockReq(ADMIN_USER, {}, { id: 999 });
            const res = mockRes();
            mockGetProductById.mockResolvedValue(null);

            await getSingleProductAdmin(req, res);

            expect(mockGetProductById).toHaveBeenCalledWith(999);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Product not found.' });
        });
        
        test('should return 500 on service error', async () => {
            const req = mockReq(ADMIN_USER, {}, { id: ACTIVE_PRODUCT.id });
            const res = mockRes();
            const serviceError = new Error('DB timeout');
            mockGetProductById.mockRejectedValue(serviceError);

            await getSingleProductAdmin(req, res);

            expect(console.error).toHaveBeenCalledWith('Error fetching single product for admin:', serviceError);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error.' });
        });
    });

    // createProduct
    describe('createProduct', () => {
        test('should create a product successfully and return 201', async () => {
            const req = mockReq(ADMIN_USER, PRODUCT_DATA_VALID);
            const res = mockRes();
            const newId = 100;

            mockProductSchemaParse.mockReturnValue(PRODUCT_DATA_VALID);
            mockCreateProduct.mockResolvedValue(newId);

            await createProduct(req, res);

            expect(mockProductSchemaParse).toHaveBeenCalledWith(PRODUCT_DATA_VALID);
            expect(mockCreateProduct).toHaveBeenCalledWith(ADMIN_USER.id, PRODUCT_DATA_VALID);
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                id: newId,
                message: 'Product created successfully.',
                ...PRODUCT_DATA_VALID
            });
        });

        test('should return 400 for Zod validation error', async () => {
            const req = mockReq(ADMIN_USER, {});
            const res = mockRes();

            mockProductSchemaParse.mockImplementation(() => { throw ZOD_ERROR; });

            await createProduct(req, res);

            expect(res.status).toHaveBeenCalledWith(400); 
            expect(res.json).toHaveBeenCalledWith({
                message: 'Validation failed.',
                errors: ZOD_ERROR_DETAILS
            });
            expect(mockCreateProduct).not.toHaveBeenCalled();
        });

        test('should return 500 on service error', async () => {
            const req = mockReq(ADMIN_USER, PRODUCT_DATA_VALID);
            const res = mockRes();
            const serviceError = new Error('Unique constraint violated');

            mockProductSchemaParse.mockReturnValue(PRODUCT_DATA_VALID);
            mockCreateProduct.mockRejectedValue(serviceError);

            await createProduct(req, res);

            expect(console.error).toHaveBeenCalledWith('Error creating product:', serviceError);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error during product creation.' });
        });
    });

    // updateProduct
    describe('updateProduct', () => {
        test('should update a product successfully and return 200', async () => {
            const req = mockReq(ADMIN_USER, PRODUCT_DATA_UPDATE, { id: ACTIVE_PRODUCT.id });
            const res = mockRes();

            mockProductSchemaPartialParse.mockReturnValue(PRODUCT_DATA_UPDATE);
            mockUpdateProduct.mockResolvedValue(true); 

            await updateProduct(req, res);

            expect(mockProductSchemaPartialParse).toHaveBeenCalledWith(PRODUCT_DATA_UPDATE);
            expect(mockUpdateProduct).toHaveBeenCalledWith(ACTIVE_PRODUCT.id, PRODUCT_DATA_UPDATE);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith({ message: 'Product updated successfully.' });
        });

        test('should return 404 if product is not found (service returns false)', async () => {
            const req = mockReq(ADMIN_USER, PRODUCT_DATA_UPDATE, { id: 999 });
            const res = mockRes();

            mockProductSchemaPartialParse.mockReturnValue(PRODUCT_DATA_UPDATE);
            mockUpdateProduct.mockResolvedValue(false); 

            await updateProduct(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Product not found.' });
        });

        test('should return 400 if no fields provided for update', async () => {
            const req = mockReq(ADMIN_USER, {}, { id: ACTIVE_PRODUCT.id });
            const res = mockRes();

            mockProductSchemaPartialParse.mockReturnValue({});

            await updateProduct(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({ message: 'No fields provided for update.' });
            expect(mockUpdateProduct).not.toHaveBeenCalled();
        });

        test('should return 400 for Zod validation error', async () => {
            const req = mockReq(ADMIN_USER, { price: 'invalid' }, { id: ACTIVE_PRODUCT.id });
            const res = mockRes();

            mockProductSchemaPartialParse.mockImplementation(() => { throw ZOD_ERROR; });

            await updateProduct(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Validation failed.',
                errors: ZOD_ERROR_DETAILS
            });
        });

        test('should return 500 on service error', async () => {
            const req = mockReq(ADMIN_USER, PRODUCT_DATA_UPDATE, { id: ACTIVE_PRODUCT.id });
            const res = mockRes();
            const serviceError = new Error('DB timeout on update');

            mockProductSchemaPartialParse.mockReturnValue(PRODUCT_DATA_UPDATE);
            mockUpdateProduct.mockRejectedValue(serviceError);

            await updateProduct(req, res);

            expect(console.error).toHaveBeenCalledWith('Error updating product:', serviceError);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error during product update.' });
        });
    });

    // deleteProduct
    describe('deleteProduct', () => {
        test('should delete a product successfully and return 204', async () => {
            const req = mockReq(ADMIN_USER, {}, { id: ACTIVE_PRODUCT.id });
            const res = mockRes();

            mockDeleteProduct.mockResolvedValue(true); 

            await deleteProduct(req, res);

            expect(mockDeleteProduct).toHaveBeenCalledWith(ACTIVE_PRODUCT.id);
            expect(res.status).toHaveBeenCalledWith(204);
            expect(res.send).toHaveBeenCalledTimes(1); 
            expect(res.json).not.toHaveBeenCalled();
        });

        test('should return 404 if product is not found (service returns false)', async () => {
            const req = mockReq(ADMIN_USER, {}, { id: 999 });
            const res = mockRes();

            mockDeleteProduct.mockResolvedValue(false); 

            await deleteProduct(req, res);

            expect(mockDeleteProduct).toHaveBeenCalledWith(999);
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: 'Product not found.' });
        });

        test('should return 500 on service error', async () => {
            const req = mockReq(ADMIN_USER, {}, { id: ACTIVE_PRODUCT.id });
            const res = mockRes();
            const serviceError = new Error('DB Lock');

            mockDeleteProduct.mockRejectedValue(serviceError);

            await deleteProduct(req, res);

            expect(console.error).toHaveBeenCalledWith('Error deleting product:', serviceError);
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({ message: 'Internal server error during product deletion.' });
        });
    });
});
