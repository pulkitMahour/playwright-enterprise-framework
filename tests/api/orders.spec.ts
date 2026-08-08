import { test, expect, APIRequestContext } from '@playwright/test';
import { test as adminContext, test as userContext } from '../../fixtures/api.fixture';
import { OrderAPI, CreateOrderInput, OrderItemInput, ShippingAddress } from '../../api/OrderAPI';
import { ProductAPI } from '../../api/ProductAPI';
import { AuthAPI } from '../../api/AuthAPI';
import { SHIPPING_CASES } from '../../data/shipping';
import { ADDRESS_CASES } from '../../data/addresses';
import { createProduct, deleteProduct, deleteOrders, deleteUsers, TestProduct } from '../../fixtures/testData';

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

const shippingAddress: ShippingAddress = {
    fullName: 'John Doe',
    street: '123 Main St',
    city: 'Springfield',
    postalCode: '12345',
    country: 'USA'
};

function makeOrderData(item: Partial<OrderItemInput> = {}): CreateOrderInput {
    return {
        items: [{ product: '', qty: 2, ...item }],
        shippingAddress: { ...shippingAddress },
    };
}

userContext.describe('Placing Orders', { tag: ['@api', '@orders'] }, () => {
    userContext.describe.configure({ mode: "serial" });

    let ordersAPI: OrderAPI;
    let productAPI: ProductAPI;
    let orderId = '';
    let productId = '';
    let existingStock = 0;
    let product: TestProduct;
    const createdOrders: string[] = [];

    userContext.beforeAll(async ({ adminApi }) => {
        product = await createProduct(adminApi);
    });

    userContext.afterAll(async ({ adminApi }) => {
        await deleteOrders(adminApi, createdOrders);
        await deleteProduct(adminApi, product._id);
    });

    userContext.beforeEach(async ({ userRequest }) => {
        ordersAPI = new OrderAPI(userRequest);
        productAPI = new ProductAPI(userRequest);
        productId = product._id;

        const response = await productAPI.getById(productId);
        existingStock = (await response.json()).countInStock;
    });

    userContext('should create an order successfully', { tag: '@smoke' }, async () => {
        const orderData = makeOrderData({ product: productId });
        const response = await ordersAPI.create(orderData);
        expect(response.status()).toBe(201);

        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('_id');
        expect(responseBody).toHaveProperty('status', 'processing');
        expect(responseBody.orderItems).toHaveLength(1);
        orderId = responseBody._id;
        createdOrders.push(orderId);

        const listResponse = await productAPI.getById(productId);
        const productDetails = await listResponse.json();
        expect(productDetails.countInStock).toBe(existingStock - orderData.items[0].qty);
    });

    userContext('should fail to create an order with insufficient stock', async () => {
        const insufficientStockOrderData = makeOrderData({ product: productId, qty: existingStock + 1 });

        const response = await ordersAPI.create(insufficientStockOrderData);
        expect(response.status()).toBe(400);

        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('error');
        expect(responseBody.error).toContain('Bad Request');
    });

    userContext('should fail to create an order with invalid product ID', async () => {
        const invalidProductOrderData = makeOrderData({ product: '6'.repeat(24) });

        const response = await ordersAPI.create(invalidProductOrderData);
        expect(response.status()).toBe(404);

        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('error');
        expect(responseBody.error).toContain('Not Found');
    });

    userContext('should fail to create an order with invalid data', async () => {
        const invalidOrderData = makeOrderData({ product: '6'.repeat(24), qty: -1 });

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

userContext.describe('Tax and Shipping Calculation', { tag: ['@api', '@orders'] }, () => {
    let ordersAPI: OrderAPI;
    let product: TestProduct;
    const createdOrders: string[] = [];

    userContext.beforeAll(async ({ adminApi }) => {
        product = await createProduct(adminApi);
    });

    userContext.afterAll(async ({ adminApi }) => {
        await deleteOrders(adminApi, createdOrders);
        await deleteProduct(adminApi, product._id);
    });

    userContext.beforeEach(async ({ userRequest }) => {
        ordersAPI = new OrderAPI(userRequest);
    });

    for (const boundary of SHIPPING_CASES) {
        userContext(`order totals with a subtotal ${boundary.label}`, async ({ adminApi }) => {
            // This case needs an exact price, so it makes its own product instead of the shared one.
            const boundaryProduct = await createProduct(adminApi, {
                description: 'Priced to land on a free-shipping boundary',
                price: boundary.price,
                countInStock: 5,
            });
            expect(boundaryProduct.price).toBe(boundary.price);

            try {
                const response = await ordersAPI.create(
                    makeOrderData({ product: boundaryProduct._id, qty: 1 }),
                );
                expect(response.status()).toBe(201);

                const order = await response.json();
                createdOrders.push(order._id);
                expect(order.itemsPrice).toBe(boundary.price);
                expect(order.taxPrice).toBe(boundary.expectedTax);
                expect(order.shippingPrice).toBe(boundary.expectedShipping);
                expect(order.totalPrice).toBe(boundary.expectedTotal);
            } finally {
                await deleteProduct(adminApi, boundaryProduct._id);
            }
        });
    }

    userContext('server should ignore client-supplied prices and names', async () => {
        const qty = 2;
        const response = await ordersAPI.create(
            makeOrderData({ product: product._id, qty, price: 1, name: 'Free Keyboard Please' }),
        );
        expect(response.status()).toBe(201);

        const responseBody = await response.json();
        createdOrders.push(responseBody._id);
        const expectedItemsPrice = Math.round(product.price * qty * 100) / 100;

        expect(responseBody.orderItems[0].price).toBe(product.price);
        expect(responseBody.orderItems[0].name).toBe(product.name);
        expect(responseBody.itemsPrice).toBe(expectedItemsPrice);
        expect(responseBody.itemsPrice).not.toBe(1);

        const calculated = calculation(expectedItemsPrice);
        expect(responseBody.taxPrice.toFixed(2)).toBe(calculated.tax);
        expect(responseBody.shippingPrice.toFixed(2)).toBe(calculated.shipping);
        expect(responseBody.totalPrice.toFixed(2)).toBe(calculated.total);
    });
});

adminContext.describe('Admin Order Management', { tag: ['@api', '@orders', '@admin'] }, () => {
    adminContext.describe.configure({ mode: "serial" });
    let ordersAPI: OrderAPI;
    let orderId = '';
    let product: TestProduct;
    const createdOrders: string[] = [];

    adminContext.beforeAll(async ({ adminApi }) => {
        product = await createProduct(adminApi);
    });

    adminContext.afterAll(async ({ adminApi }) => {
        await deleteOrders(adminApi, createdOrders);
        await deleteProduct(adminApi, product._id);
    });

    adminContext.beforeEach(async ({ adminRequest }) => {
        ordersAPI = new OrderAPI(adminRequest);
    });

    adminContext('should list all orders for admin', { tag: '@sanity' }, async () => {
        const createResponse = await ordersAPI.create(
            makeOrderData({ product: product._id }),
        );
        expect(createResponse.status()).toBe(201);
        const createResponseBody = await createResponse.json();
        orderId = createResponseBody._id;
        createdOrders.push(orderId);

        const response = await ordersAPI.listAll();
        expect(response.status()).toBe(200);

        const responseBody = await response.json();
        expect(Array.isArray(responseBody)).toBe(true);
        expect(responseBody.length).toBeGreaterThan(0);
    });

    adminContext('should retrieve mine orders for admin', { tag: '@sanity' }, async () => {
        const response = await ordersAPI.getMine();
        expect(response.status()).toBe(200);

        const responseBody = await response.json();
        expect(Array.isArray(responseBody)).toBe(true);
    });

    adminContext('should retrieve an order by ID for admin', { tag: '@sanity' }, async () => {
        const response = await ordersAPI.getById(orderId);
        expect(response.status()).toBe(200);

        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('_id', orderId);
    });

    adminContext('should update order status for admin', { tag: '@sanity' }, async () => {
        const newStatus = { status: 'shipped' };
        const response = await ordersAPI.updateStatus(orderId, newStatus);
        expect(response.status()).toBe(200);

        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('_id', orderId);
        expect(responseBody).toHaveProperty('status', newStatus.status);
    });

    adminContext('should remove an order for admin', { tag: '@sanity' }, async () => {
        const response = await ordersAPI.remove(orderId);
        expect(response.status()).toBe(200);

        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('id', orderId);

        const getResponse = await ordersAPI.getById(orderId);
        expect(getResponse.status()).toBe(404);
    });
});

userContext.describe('Order Ownership', { tag: ['@api', '@orders'] }, () => {
    let product: TestProduct;
    const createdOrders: string[] = [];
    const createdUsers: string[] = [];

    userContext.beforeAll(async ({ adminApi }) => {
        product = await createProduct(adminApi);
    });

    userContext.afterAll(async ({ adminApi }) => {
        await deleteOrders(adminApi, createdOrders);
        await deleteUsers(adminApi, createdUsers);
        await deleteProduct(adminApi, product._id);
    });

    async function createOrderWith(context: APIRequestContext, productId: string): Promise<string> {
        const ordersAPI = new OrderAPI(context);
        const response = await ordersAPI.create(
            makeOrderData({ product: productId, qty: 1 }),
        );
        expect(response.status()).toBe(201);

        const orderId = (await response.json())._id;
        createdOrders.push(orderId);
        return orderId;
    }

    userContext('another user should not be able to view my order', async ({ userRequest, request }) => {
        const orderId = await createOrderWith(userRequest, product._id);

        const stamp = Date.now();
        const registerResponse = await new AuthAPI(request).register(
            `Other User ${stamp}`, `other${stamp}@demo.com`, 'other123',
        );
        expect(registerResponse.status()).toBe(201);
        createdUsers.push((await registerResponse.json()).id);

        const otherOrdersAPI = new OrderAPI(request);
        const response = await otherOrdersAPI.getById(orderId);
        expect(response.status()).toBe(403);

        const responseBody = await response.json();
        expect(responseBody.message).toContain('Not authorized to view this order');

        const mineResponse = await otherOrdersAPI.getMine();
        expect(mineResponse.status()).toBe(200);
        expect(await mineResponse.json()).toHaveLength(0);
    });

    userContext('admin should be able to view any order', async ({ userRequest, adminRequest }) => {
        const orderId = await createOrderWith(userRequest, product._id);

        const response = await new OrderAPI(adminRequest).getById(orderId);
        expect(response.status()).toBe(200);

        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('_id', orderId);
    });

    userContext('owner should still be able to view their own order', async ({ userRequest }) => {
        const orderId = await createOrderWith(userRequest, product._id);

        const response = await new OrderAPI(userRequest).getById(orderId);
        expect(response.status()).toBe(200);
        expect(await response.json()).toHaveProperty('_id', orderId);
    });
});

userContext.describe('Order Shipping Address', { tag: ['@api', '@orders'] }, () => {
    let product: TestProduct;
    const createdOrders: string[] = [];

    userContext.beforeAll(async ({ adminApi }) => {
        product = await createProduct(adminApi);
    });

    userContext.afterAll(async ({ adminApi }) => {
        await deleteOrders(adminApi, createdOrders);
        await deleteProduct(adminApi, product._id);
    });

    for (const { label, address } of ADDRESS_CASES) {
        userContext(`an order round-trips ${label}`, async ({ userRequest }) => {
            const ordersAPI = new OrderAPI(userRequest);
            const response = await ordersAPI.create({
                items: [{ product: product._id, qty: 1 }],
                shippingAddress: address,
            });
            expect(response.status()).toBe(201);

            const created = await response.json();
            createdOrders.push(created._id);
            expect(created.shippingAddress).toEqual(address);

            const reread = await ordersAPI.getById(created._id);
            expect(reread.status()).toBe(200);
            expect((await reread.json()).shippingAddress).toEqual(address);
        });
    }
});

test.describe('Order API - Unauthorized Access', { tag: ['@api', '@orders'] }, () => {
    let ordersAPI: OrderAPI;

    test.beforeEach(async ({ request }) => {
        ordersAPI = new OrderAPI(request);
    });

    test('should fail to create an order without authentication', async () => {
        const response = await ordersAPI.create(makeOrderData());
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
