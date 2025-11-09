import * as OrderController from '../api/order_controller.js';
import { ZodError } from 'zod';

// Mocks
var mockOrderSchemaParse = jest.fn();
var mockCreateOrder = jest.fn();
var mockGetAllOrders = jest.fn();

// Mock modules
jest.mock('../schemas/order_schema.js', () => ({
    orderSchema: { parse: mockOrderSchemaParse },
}));

jest.mock('../services/order_service.js', () => ({
    createOrder: mockCreateOrder,
    getAllOrders: mockGetAllOrders,
}));

// Sample data
const USER = { id: 1, username: 'testuser', role: 'user' };
const ORDER_ITEMS_VALID = [{ productId: 101, quantity: 2 }];
const ORDER_ID = 50;
const PARSED_ORDERS = [
    { orderId: 10, title: 'Order #10', total_amount: 10.00, order_items: [] },
];

// Helpers for req/res
const mockReq = (body, user = USER) => ({ body, user });
const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnThis();
    res.json = jest.fn().mockReturnThis();
    return res;
};

describe('OrderController', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        jest.spyOn(console, 'error').mockImplementation(() => {});
    });
    afterEach(() => {
        jest.restoreAllMocks();
    });

    // POST /api/orders
    describe('createOrder', () => {
        test('should create an order and return 201', async () => {
            const req = mockReq(ORDER_ITEMS_VALID);
            const res = mockRes();

            mockOrderSchemaParse.mockReturnValue(ORDER_ITEMS_VALID);
            mockCreateOrder.mockResolvedValue(ORDER_ID);

            await OrderController.createOrder(req, res);

            expect(mockOrderSchemaParse).toHaveBeenCalledWith(req.body);
            expect(mockCreateOrder).toHaveBeenCalledWith(USER.id, ORDER_ITEMS_VALID);

            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Order successfully created.',
                orderId: ORDER_ID,
            });
        });

        test('should return 400 for Zod validation error', async () => {
            const req = mockReq({});
            const res = mockRes();
            const mockIssues = [{ path: ['items'], message: 'Expected array' }];
            const validationError = new ZodError(mockIssues);

            mockOrderSchemaParse.mockImplementation(() => { throw validationError; });

            await OrderController.createOrder(req, res);

            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
                message: 'Validation failed for order items.',
            }));
            expect(mockCreateOrder).not.toHaveBeenCalled();
        });

        test('should return 404 if product check fails in service', async () => {
            const req = mockReq(ORDER_ITEMS_VALID);
            const res = mockRes();
            const serviceError = new Error('Product ID 999 not available.');

            mockOrderSchemaParse.mockReturnValue(ORDER_ITEMS_VALID);
            mockCreateOrder.mockRejectedValue(serviceError);

            await OrderController.createOrder(req, res);

            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({ message: serviceError.message });
        });

        test('should return 500 for other internal errors', async () => {
            const req = mockReq(ORDER_ITEMS_VALID);
            const res = mockRes();
            const internalError = new Error('Generic DB error.');

            mockOrderSchemaParse.mockReturnValue(ORDER_ITEMS_VALID);
            mockCreateOrder.mockRejectedValue(internalError);

            await OrderController.createOrder(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Internal server error while processing order.'
            });
        });
    });

    // GET /api/orders
    describe('getOrders', () => {
        test('should return parsed orders and 200', async () => {
            const req = mockReq({});
            const res = mockRes();

            mockGetAllOrders.mockResolvedValue(PARSED_ORDERS);

            await OrderController.getOrders(req, res);

            expect(mockGetAllOrders).toHaveBeenCalledWith(USER.id);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith(PARSED_ORDERS);
        });

        test('should return empty array when no orders', async () => {
            const req = mockReq({});
            const res = mockRes();

            mockGetAllOrders.mockResolvedValue([]);

            await OrderController.getOrders(req, res);

            expect(mockGetAllOrders).toHaveBeenCalledWith(USER.id);
            expect(res.status).toHaveBeenCalledWith(200);
            expect(res.json).toHaveBeenCalledWith([]);
        });

        test('should return 500 if service throws an error', async () => {
            const req = mockReq({});
            const res = mockRes();
            const dbError = new Error('Database connection failed');

            mockGetAllOrders.mockRejectedValue(dbError);

            const consoleErrorSpy = jest.spyOn(console, 'error');

            await OrderController.getOrders(req, res);

            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                message: 'Internal server error while fetching orders.'
            });
            expect(consoleErrorSpy).toHaveBeenCalledWith('Error fetching orders:', dbError);
            consoleErrorSpy.mockRestore();
        });
    });
});
