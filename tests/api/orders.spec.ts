import { test, expect, APIRequestContext } from '@playwright/test';
import { test as adminContext, test as userContext } from '../../fixtures/api.fixture';
import { OrderAPI, CreateOrderInput, OrderItemInput, ShippingAddress } from '../../api/OrderAPI';
import { ProductAPI } from '../../api/ProductAPI';
import { AuthAPI } from '../../api/AuthAPI';

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

const PRODUCT_NAME = 'Vortex Mechanical Keyboard';

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

userContext.describe('Placing Orders', () => {
    userContext.describe.configure({ mode: "serial" });

    let ordersAPI: OrderAPI;
    let productAPI: ProductAPI;
    let orderId = '';
    let productId = '';
    let existingStock = 0;

    userContext.beforeEach(async ({ userRequest }) => {
        ordersAPI = new OrderAPI(userRequest);
        productAPI = new ProductAPI(userRequest);

        const listResponse = await productAPI.list({ keyword: PRODUCT_NAME });
        const products = await listResponse.json();
        expect(products.products.length).toBeGreaterThan(0);
        productId = products.products[0]._id;
        existingStock = products.products[0].countInStock;
    });

    userContext('should create an order successfully', async () => {
        const orderData = makeOrderData({ product: productId });
        const response = await ordersAPI.create(orderData);
        expect(response.status()).toBe(201);

        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('_id');
        expect(responseBody).toHaveProperty('status', 'processing');
        expect(responseBody.orderItems).toHaveLength(1);
        orderId = responseBody._id;

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

userContext.describe('Tax and Shipping Calculation', () => {
    userContext.describe.configure({ mode: "serial" });
    let ordersAPI: OrderAPI;
    let productAPI: ProductAPI;

    userContext.beforeEach(async ({ userRequest }) => {
        ordersAPI = new OrderAPI(userRequest);
        productAPI = new ProductAPI(userRequest);
    });

    userContext('order more than $100 should have free shipping', async () => {
        const listResponse = await productAPI.list({ sort: 'price-desc' });
        const products = await listResponse.json();
        expect(products.products.length).toBeGreaterThan(0);

        const expensive = products.products.find((product: { price: number }) => product.price > 100);
        expect(expensive, `no seeded product costs over $100`).toBeDefined();

        const response = await ordersAPI.create(makeOrderData({ product: expensive._id, qty: 1 }));
        expect(response.status()).toBe(201);

        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('itemsPrice');

        const calculated = calculation(responseBody.itemsPrice);
        expect(responseBody.taxPrice.toFixed(2)).toBe(calculated.tax);
        expect(responseBody.shippingPrice.toFixed(2)).toBe(calculated.shipping);
        expect(responseBody.shippingPrice).toBe(0);
        expect(responseBody.totalPrice.toFixed(2)).toBe(calculated.total);
    });

    userContext('order less than $100 should have shipping charges', async () => {
        const listResponse = await productAPI.list({ sort: 'price-asc' });
        const products = await listResponse.json();
        expect(products.products.length).toBeGreaterThan(0);

        const cheap = products.products.find((product: { price: number }) => product.price < 100);
        expect(cheap, `no seeded product costs under $100`).toBeDefined();

        const response = await ordersAPI.create(makeOrderData({ product: cheap._id, qty: 1 }));
        expect(response.status()).toBe(201);

        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('itemsPrice');

        const calculated = calculation(responseBody.itemsPrice);
        expect(responseBody.taxPrice.toFixed(2)).toBe(calculated.tax);
        expect(responseBody.shippingPrice.toFixed(2)).toBe(calculated.shipping);
        expect(responseBody.shippingPrice).toBe(10);
        expect(responseBody.totalPrice.toFixed(2)).toBe(calculated.total);
    });

    userContext('order of exactly $100.00 should still pay shipping', async ({ adminRequest }) => {
        const adminProductAPI = new ProductAPI(adminRequest);
        const createResponse = await adminProductAPI.create({
            name: `Boundary Product ${Date.now()}`,
            description: 'Priced to land exactly on the free-shipping threshold',
            price: 100,
            category: 'Electronics',
            countInStock: 5,
        });
        expect(createResponse.status()).toBe(201);
        const boundaryProduct = await createResponse.json();
        expect(boundaryProduct.price).toBe(100);

        try {
            const response = await ordersAPI.create(
                makeOrderData({ product: boundaryProduct._id, qty: 1 }),
            );
            expect(response.status()).toBe(201);

            const responseBody = await response.json();
            expect(responseBody.itemsPrice).toBe(100);
            expect(responseBody.shippingPrice).toBe(10);
            expect(responseBody.taxPrice).toBe(10);
            expect(responseBody.totalPrice).toBe(120);
        } finally {
            await adminProductAPI.remove(boundaryProduct._id);
        }
    });

    userContext('server should ignore client-supplied prices and names', async () => {
        const listResponse = await productAPI.list({ keyword: PRODUCT_NAME });
        const products = await listResponse.json();
        expect(products.products.length).toBeGreaterThan(0);
        const product = products.products[0];

        const qty = 2;
        const response = await ordersAPI.create(
            makeOrderData({ product: product._id, qty, price: 1, name: 'Free Keyboard Please' }),
        );
        expect(response.status()).toBe(201);

        const responseBody = await response.json();
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
        const listResponse = await productAPI.list({ keyword: PRODUCT_NAME });
        const products = await listResponse.json();
        expect(products.products.length).toBeGreaterThan(0);

        const createResponse = await ordersAPI.create(
            makeOrderData({ product: products.products[0]._id }),
        );
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

userContext.describe('Order Ownership', () => {
    async function createOrderWith(context: APIRequestContext): Promise<string> {
        const productAPI = new ProductAPI(context);
        const listResponse = await productAPI.list({ keyword: PRODUCT_NAME });
        const products = await listResponse.json();
        expect(products.products.length).toBeGreaterThan(0);

        const ordersAPI = new OrderAPI(context);
        const response = await ordersAPI.create(
            makeOrderData({ product: products.products[0]._id, qty: 1 }),
        );
        expect(response.status()).toBe(201);
        return (await response.json())._id;
    }

    userContext('another user should not be able to view my order', async ({ userRequest, request }) => {
        const orderId = await createOrderWith(userRequest);

        const stamp = Date.now();
        const registerResponse = await new AuthAPI(request).register(
            `Other User ${stamp}`, `other${stamp}@demo.com`, 'other123',
        );
        expect(registerResponse.status()).toBe(201);

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
        const orderId = await createOrderWith(userRequest);

        const response = await new OrderAPI(adminRequest).getById(orderId);
        expect(response.status()).toBe(200);

        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('_id', orderId);
    });

    userContext('owner should still be able to view their own order', async ({ userRequest }) => {
        const orderId = await createOrderWith(userRequest);

        const response = await new OrderAPI(userRequest).getById(orderId);
        expect(response.status()).toBe(200);
        expect(await response.json()).toHaveProperty('_id', orderId);
    });
});

test.describe('Order API - Unauthorized Access', () => {
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
