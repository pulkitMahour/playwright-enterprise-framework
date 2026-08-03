import { test, expect } from '@playwright/test';
import { ProductAPI } from '../../api/ProductAPI';
import { test as adminContext, test as userContext } from '../../fixtures/api.fixture';

function validProduct() {
    return {
        name: `Test Product ${Date.now()}`,
        description: 'This is a test product',
        price: 99.99,
        category: 'Electronics',
        countInStock: 10,
    };
}

test.describe('Product Query Tests', () => {
    let productAPI: ProductAPI;

    test.beforeEach(async ({ request }) => {
        productAPI = new ProductAPI(request);
    });

    test('should list products', async () => {
        const response = await productAPI.list();
        expect(response.status()).toBe(200);
        const products = await response.json();
        expect(Array.isArray(products.products)).toBe(true);
    });

    test('Product Query: product keyword search should return relevant products', async () => {
        const keyword = 'laptop';
        const response = await productAPI.list({ keyword });
        expect(response.status()).toBe(200);
        const products = await response.json();
        expect(Array.isArray(products.products)).toBe(true);
        expect(products.products.length).toBeGreaterThan(0);
        for (const product of products.products) {
            expect(product.name.toLowerCase()).toContain(keyword);
        }
    });

    test('Product Query: invalid product search should return empty results', async () => {
        const keyword = 'non existent product';
        const response = await productAPI.list({ keyword });
        expect(response.status()).toBe(200);
        const products = await response.json();
        expect(Array.isArray(products.products)).toBe(true);
        expect(products.products.length).toBe(0);
    });

    test('Product Query: product category filter should return relevant products', async () => {
        const category = 'Electronics';
        const response = await productAPI.list({ category });
        expect(response.status()).toBe(200);
        const products = await response.json();
        expect(Array.isArray(products.products)).toBe(true);
        expect(products.products.length).toBeGreaterThan(0);
        for (const product of products.products) {
            expect(product.category).toBe(category);
        }
    });

    test('Product Query: product sorting should return products in correct order', async () => {
        const sort = 'price-asc';
        const response = await productAPI.list({ sort });
        expect(response.status()).toBe(200);
        const products = await response.json();
        expect(Array.isArray(products.products)).toBe(true);
        expect(products.products.length).toBeGreaterThan(0);
        for (let i = 1; i < products.products.length; i++) {
            expect(products.products[i].price).toBeGreaterThanOrEqual(products.products[i - 1].price);
        }
    });

    test('Product Query: pagination should return a different slice per page', async () => {
        const firstResponse = await productAPI.list({ page: 1 });
        const secondResponse = await productAPI.list({ page: 2 });
        expect(firstResponse.status()).toBe(200);
        expect(secondResponse.status()).toBe(200);

        const firstPage = await firstResponse.json();
        const secondPage = await secondResponse.json();

        expect(firstPage.page).toBe(1);
        expect(secondPage.page).toBe(2);
        expect(firstPage.total).toBe(secondPage.total);
        expect(firstPage.products.length).toBeLessThanOrEqual(firstPage.limit);
        expect(secondPage.products.length).toBeLessThanOrEqual(secondPage.limit);

        expect(secondPage.products.length).toBeGreaterThan(0);
        const firstPageIds = firstPage.products.map((product: { _id: string }) => product._id);
        for (const product of secondPage.products) {
            expect(firstPageIds).not.toContain(product._id);
        }
    });

    test('Product Query: limit caps the page size', async () => {
        const response = await productAPI.list({ limit: 1 });
        expect(response.status()).toBe(200);
        const products = await response.json();
        expect(products.limit).toBe(1);
        expect(products.products.length).toBe(1);
    });

    test('Product Query: invalid sort value should be rejected', async () => {
        const response = await productAPI.list({ sort: 'not-a-sort' });
        expect(response.status()).toBe(400);
    });

    test('should get product categories', async () => {
        const response = await productAPI.getCategories();
        expect(response.status()).toBe(200);
        const categories = await response.json();
        expect(Array.isArray(categories)).toBe(true);
    });

    test('should get product by ID', async () => {
        const listResponse = await productAPI.list();
        const products = await listResponse.json();
        const productId = products.products[0]._id;
        const response = await productAPI.getById(productId);
        expect(response.status()).toBe(200);
        const product = await response.json();
        expect(product._id).toBe(productId);
    });

    test('invalid product ID should return 404', async () => {
        const invalidId = '6'.repeat(24);
        const response = await productAPI.getById(invalidId);
        expect(response.status()).toBe(404);
    });
});

adminContext.describe('Product Management Tests', () => {
    adminContext.describe.configure({ mode: 'serial' });

    let productAPI: ProductAPI;
    let id: string;

    adminContext.beforeEach(async ({ adminRequest }) => {
        productAPI = new ProductAPI(adminRequest);
    });

    adminContext('should create a new product', async () => {
        const newProduct = {
            name: `Test Product ${Date.now()}`,
            description: 'This is a test product',
            price: 99.99,
            category: 'Electronics',
            countInStock: 10,
        };
        const response = await productAPI.create(newProduct);
        expect(response.status()).toBe(201);
        const createdProduct = await response.json();
        expect(createdProduct.name).toBe(newProduct.name);
        id = createdProduct._id;
    });

    adminContext('should update an existing product', async () => {
        const updatedData = {
            name: `Updated Product ${Date.now()}`,
            price: 79.99,
        };
        const response = await productAPI.update(id, updatedData);
        expect(response.status()).toBe(200);
        const updatedProduct = await response.json();
        expect(updatedProduct.name).toBe(updatedData.name);
        expect(updatedProduct.price).toBe(updatedData.price);
    });

    adminContext('should delete a product', async () => {
        const response = await productAPI.remove(id);
        expect(response.status()).toBe(200);

        const getResponse = await productAPI.getById(id);
        expect(getResponse.status()).toBe(404);
    });

    const invalidPayloads: Array<{ label: string; payload: Record<string, unknown> }> = [
        { label: 'empty body', payload: {} },
        {
            label: 'missing countInStock',
            payload: { name: 'No Stock Field', price: 10, category: 'Electronics' },
        },
        {
            label: 'name shorter than 2 chars',
            payload: { name: 'A', price: 10, category: 'Electronics', countInStock: 1 },
        },
        {
            label: 'negative price',
            payload: { name: 'Negative Price', price: -1, category: 'Electronics', countInStock: 1 },
        },
        {
            label: 'negative countInStock',
            payload: { name: 'Negative Stock', price: 10, category: 'Electronics', countInStock: -1 },
        },
        {
            label: 'rating above the max of 5',
            payload: {
                name: 'Overrated', price: 10, category: 'Electronics', countInStock: 1, rating: 6,
            },
        },
        {
            label: 'price sent as a string',
            payload: { name: 'String Price', price: '10', category: 'Electronics', countInStock: 1 },
        },
    ];

    for (const { label, payload } of invalidPayloads) {
        adminContext(`create should reject ${label}`, async () => {
            const response = await productAPI.create(payload);
            expect(response.status()).toBe(400);
        });
    }

});

test.describe('Product Management Tests (unauthenticated)', () => {
    let productAPI: ProductAPI;

    test.beforeEach(async ({ request }) => {
        productAPI = new ProductAPI(request);
    });

    test('unauthenticated should not create a product', async () => {
        const response = await productAPI.create(validProduct());
        expect(response.status()).toBe(401);
    });
});

userContext.describe('Product Management Tests (non-admin user)', () => {
    let productAPI: ProductAPI;

    userContext.beforeEach(async ({ userRequest }) => {
        productAPI = new ProductAPI(userRequest);
    });

    userContext('non-admin should not create a product', async () => {
        const response = await productAPI.create(validProduct());
        expect(response.status()).toBe(403);
    });
});