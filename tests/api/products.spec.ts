import { test, expect } from '@playwright/test';
import { ProductAPI } from '../../api/ProductAPI';
import { test as adminContext } from '../../fixtures/api.fixture';

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
        const category = 'electronics';
        const response = await productAPI.list({ category });
        expect(response.status()).toBe(200);
        const products = await response.json();
        expect(Array.isArray(products.products)).toBe(true);
        for (const product of products.products) {
            expect(product.category.toLowerCase()).toBe(category);
        }
    });

    test('Product Query: product sorting should return products in correct order', async () => {
        const sort = 'price-asc';
        const response = await productAPI.list({ sort });
        expect(response.status()).toBe(200);
        const products = await response.json();
        expect(Array.isArray(products.products)).toBe(true);
        for (let i = 1; i < products.products.length; i++) {
            expect(products.products[i].price).toBeGreaterThanOrEqual(products.products[i - 1].price);
        }
    });

    test('Product Query: pagination should return correct number of products per page', async () => {
        const page = 2;
        const response = await productAPI.list({ page });
        expect(response.status()).toBe(200);
        const products = await response.json();
        expect(Array.isArray(products.products)).toBe(true);
        expect(products.products.length).toBeLessThanOrEqual(12);
    });

    test('should get product categories', async () => {
        const response = await productAPI.getCategories();
        expect(response.status()).toBe(200);
        const categories = await response.json();
        console.log('Product Categories:', categories);
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
        const invalidId = 'invalid-id';
        const response = await productAPI.getById(invalidId);
        expect(response.status()).toBe(404);
    });
});

adminContext.describe('Product Management Tests', () => {
    let productAPI: ProductAPI;
    let id: string;

    adminContext.beforeEach(async ({ adminRequest }) => {
        ;
        productAPI = new ProductAPI(adminRequest);
    });

    adminContext('should create a new product', async () => {
        const newProduct = {
            name: `Test Product ${Date.now()}`,
            description: 'This is a test product',
            price: 99.99,
            category: 'electronics',
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
    });

});

test.describe('Product Management Tests (non-admin)', () => {
    let productAPI: ProductAPI;

    test.beforeEach(async ({ request }) => {
        productAPI = new ProductAPI(request);
    });

    test('non-admin should not create a new product', async () => {
        const newProduct = {
            name: `Test Product ${Date.now()}`,
            description: 'This is a test product',
            price: 99.99,
            category: 'electronics',
            countInStock: 10,
        };
        const response = await productAPI.create(newProduct);
        expect(response.status()).toBe(401);
    });

});