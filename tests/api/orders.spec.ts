import { test, expect } from '@playwright/test';
import { test as adminContext, test as userContext } from '../../fixtures/api.fixture';
import { OrderAPI, CreateOrderInput } from '../../api/OrderAPI';
import { ProductAPI } from '../../api/ProductAPI';

function calculation(price: number): { tax: string; shipping: string; total: string } {
    const taxNum = Math.round(price * 0.1 * 100) / 100;
    const shippingNum = price > 100 ? 0 : 10;
    const totalNum = Math.round((price + taxNum + shippingNum) * 100) / 100;

    return {
        tax: taxNum.toFixed(2),
        shipping: shippingNum.toFixed(2),
        total: totalNum.toFixed(2)
    };
}

const orderData: CreateOrderInput = {
    items: [
        {
            name: 'Vortex Mechanical Keyboard',
            product: '',
            qty: 2,
        }
    ],
    shippingAddress: {
        fullName: 'John Doe',
        street: '123 Main St',
        city: 'Springfield',
        postalCode: '12345',
        country: 'USA'
    },
}

userContext.describe('Placing Orders', () => {
    userContext.describe.configure({ mode: "serial" });

    let ordersAPI: OrderAPI;
    let productAPI: ProductAPI;
    let orderId = '';
    let existingStock = 0;

    userContext.beforeEach(async ({ userRequest }) => {
        ordersAPI = new OrderAPI(userRequest);
        productAPI = new ProductAPI(userRequest);

        const listResponse = await productAPI.list({ keyword: orderData.items[0].name });
        const products = await listResponse.json();
        expect(products.products.length).toBeGreaterThan(0);
        orderData.items[0].product = products.products[0]._id;
        existingStock = products.products[0].countInStock;
    });

    userContext('should create an order successfully', async () => {
        const response = await ordersAPI.create(orderData);
        expect(response.status()).toBe(201);

        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('_id');
        expect(responseBody).toHaveProperty('status', 'processing');
        expect(responseBody.orderItems).toHaveLength(1);
        orderId = responseBody._id;

        const listResponse = await productAPI.getById(orderData.items[0].product);
        const productDetails = await listResponse.json();
        expect(productDetails.countInStock).toBe(existingStock - orderData.items[0].qty);
    });

    userContext('should fail to create an order with insufficient stock', async () => {
        const insufficientStockOrderData = { ...orderData, items: [{ ...orderData.items[0], qty: existingStock + 1 }] };

        const response = await ordersAPI.create(insufficientStockOrderData);
        expect(response.status()).toBe(400);

        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('error');
        expect(responseBody.error).toContain('Bad Request');
    });

    userContext('should fail to create an order with invalid product ID', async () => {
        const invalidProductOrderData = { ...orderData, items: [{ ...orderData.items[0], product: '6'.repeat(24) }] };

        const response = await ordersAPI.create(invalidProductOrderData);
        expect(response.status()).toBe(404);

        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('error');
        expect(responseBody.error).toContain('Not Found');
    });

    userContext('should fail to create an order with invalid data', async () => {
        const invalidOrderData = { ...orderData, items: [{ ...orderData.items[0], product: '6'.repeat(24), qty: -1 }] };

        const response = await ordersAPI.createRaw(invalidOrderData);
        expect(response.status()).toBe(400);

        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('error');
        expect(responseBody.error).toContain('Bad Request');
    });

    userContext('should retrieve my order successfully', async () => {
        const response = await ordersAPI.getMine();
        expect(response.status()).toBe(200);

        const responseBody = await response.json();
        expect(responseBody.length).toBeGreaterThan(0);
    });

    userContext('should retrieve an order by ID successfully', async () => {
        const response = await ordersAPI.getById(orderId);
        expect(response.status()).toBe(200);

        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('_id', orderId);
    });

    userContext('should fail to retrieve an order with invalid ID', async () => {
        const invalidOrderId = '6'.repeat(24);
        const response = await ordersAPI.getById(invalidOrderId);
        expect(response.status()).toBe(404);

        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('error');
        expect(responseBody.error).toContain('Not Found');
    });

    userContext('admin orders retrieval should fail for non-admin users', async () => {
        const response = await ordersAPI.listAll();
        expect(response.status()).toBe(403);

        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('error');
        expect(responseBody.error).toContain('Forbidden');
        expect(responseBody.message).toContain('Admin access required');
    });
});

userContext.describe('Tax and Shipping Calculation', () => {
    let ordersAPI: OrderAPI;
    let productAPI: ProductAPI;

    userContext.beforeEach(async ({ userRequest }) => {
        ordersAPI = new OrderAPI(userRequest);
        productAPI = new ProductAPI(userRequest);
    });

    userContext('order more than $100 should have tax calculated', async () => {
        const expensiveOrderData = { ...orderData };

        const listResponse = await productAPI.list({ sort: 'price-desc' });
        const products = await listResponse.json();
        expect(products.products.length).toBeGreaterThan(0);
        for (const product of products.products) {
            if (product.price > 100) {
                expensiveOrderData.items[0].name = product.name;
                expensiveOrderData.items[0].product = product._id;
                expensiveOrderData.items[0].qty = 1;
                break;
            }
        }

        const response = await ordersAPI.create(expensiveOrderData);
        expect(response.status()).toBe(201);

        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('itemsPrice');

        const calculated = calculation(responseBody.itemsPrice);
        expect(responseBody.taxPrice.toFixed(2)).toBe(calculated.tax);
        expect(responseBody.shippingPrice.toFixed(2)).toBe(calculated.shipping);
        expect(responseBody.totalPrice.toFixed(2)).toBe(calculated.total);
    });

    userContext('order less than $100 should have free shipping', async () => {
        const cheapOrderData = { ...orderData };

        const listResponse = await productAPI.list({ sort: 'price-asc' });
        const products = await listResponse.json();
        expect(products.products.length).toBeGreaterThan(0);
        for (const product of products.products) {
            if (product.price < 100) {
                cheapOrderData.items[0].name = product.name;
                cheapOrderData.items[0].product = product._id;
                cheapOrderData.items[0].qty = 1;
                break;
            }
        }

        const response = await ordersAPI.create(cheapOrderData);
        expect(response.status()).toBe(201);

        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('itemsPrice');

        const calculated = calculation(responseBody.itemsPrice);
        expect(responseBody.taxPrice.toFixed(2)).toBe(calculated.tax);
        expect(responseBody.shippingPrice.toFixed(2)).toBe(calculated.shipping);
        expect(responseBody.totalPrice.toFixed(2)).toBe(calculated.total);
    });
});

adminContext.describe('Admin Order Management', () => {
    adminContext.describe.configure({ mode: "serial" });
    let ordersAPI: OrderAPI;
    let productAPI: ProductAPI;
    let orderId = '';

    adminContext.beforeEach(async ({ adminRequest }) => {
        ordersAPI = new OrderAPI(adminRequest);
        productAPI = new ProductAPI(adminRequest);
    });

    adminContext('should list all orders for admin', async () => {
        const listResponse = await productAPI.list({ keyword: orderData.items[0].name });
        const products = await listResponse.json();
        expect(products.products.length).toBeGreaterThan(0);
        orderData.items[0].product = products.products[0]._id;

        const createResponse = await ordersAPI.create(orderData);
        expect(createResponse.status()).toBe(201);
        const createResponseBody = await createResponse.json();
        orderId = createResponseBody._id;

        const response = await ordersAPI.listAll();
        expect(response.status()).toBe(200);

        const responseBody = await response.json();
        expect(Array.isArray(responseBody)).toBe(true);
        expect(responseBody.length).toBeGreaterThan(0);
    });

    adminContext('should retrieve mine orders for admin', async () => {
        const response = await ordersAPI.getMine();
        expect(response.status()).toBe(200);

        const responseBody = await response.json();
        expect(Array.isArray(responseBody)).toBe(true);
    });

    adminContext('should retrieve an order by ID for admin', async () => {
        const response = await ordersAPI.getById(orderId);
        expect(response.status()).toBe(200);

        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('_id', orderId);
    });

    adminContext('should update order status for admin', async () => {
        const newStatus = { status: 'shipped' };
        const response = await ordersAPI.updateStatus(orderId, newStatus);
        expect(response.status()).toBe(200);

        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('_id', orderId);
        expect(responseBody).toHaveProperty('status', newStatus.status);
    });

    adminContext('should remove an order for admin', async () => {
        const response = await ordersAPI.remove(orderId);
        expect(response.status()).toBe(200);

        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('id', orderId);

        const getResponse = await ordersAPI.getById(orderId);
        expect(getResponse.status()).toBe(404);
    });
});

test.describe('Order API - Unauthorized Access', () => {
    let ordersAPI: OrderAPI;

    test.beforeEach(async ({ request }) => {
        ordersAPI = new OrderAPI(request);
    });

    test('should fail to create an order without authentication', async () => {
        const response = await ordersAPI.create(orderData);
        expect(response.status()).toBe(401);

        const responseBody = await response.json();
        expect(responseBody.message).toContain('Unauthorized');
    });

    test('should fail to retrieve my orders without authentication', async () => {
        const response = await ordersAPI.getMine();
        expect(response.status()).toBe(401);

        const responseBody = await response.json();
        expect(responseBody.message).toContain('Unauthorized');
    });

    test('should fail to retrieve an order by ID without authentication', async () => {
        const invalidOrderId = '6'.repeat(24);
        const response = await ordersAPI.getById(invalidOrderId);
        expect(response.status()).toBe(401);

        const responseBody = await response.json();
        expect(responseBody.message).toContain('Unauthorized');
    });
});