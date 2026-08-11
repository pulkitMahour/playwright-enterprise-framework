import { test, expect } from '@playwright/test';
import { ProductAPI } from '../../api/ProductAPI';
import { test as adminContext, test as userContext } from '../../fixtures/api.fixture';
import { PRODUCT_CREATE_CASES, validProduct } from '../../data/products';
import { SEARCH_CASES, EMPTY_SEARCH_CASES } from '../../data/search';

test.describe('Product Query Tests', { tag: ['@api', '@catalog'] }, () => {
    let productAPI: ProductAPI;

    test.beforeEach(({ request }) => {
        productAPI = new ProductAPI(request);
    });

    test('should list products', { tag: '@smoke' }, async () => {
        const response = await productAPI.list();
        expect(response.status()).toBe(200);
        const products = await response.json();
        expect(Array.isArray(products.products)).toBe(true);
    });

    for (const { label, keyword, expectedNames } of SEARCH_CASES) {
        test(`Product Query: keyword search matches ${label}`, { tag: '@sanity' }, async () => {
            const response = await productAPI.list({ keyword, limit: 100 });
            expect(response.status()).toBe(200);
            const { products } = await response.json();

            const names: string[] = products.map((product: { name: string }) => product.name);
            expect(names).toEqual(expect.arrayContaining([...expectedNames]));

            for (const name of names) {
                expect(name.toLowerCase()).toContain(keyword.toLowerCase());
            }
        });
    }

    for (const { label, keyword } of EMPTY_SEARCH_CASES) {
        test(`Product Query: keyword search finds nothing for ${label}`, async () => {
            const response = await productAPI.list({ keyword, limit: 100 });
            expect(response.status()).toBe(200);
            const { products } = await response.json();
            expect(products).toEqual([]);
        });
    }

    test(
        'Product Query: product category filter should return relevant products',
        { tag: '@sanity' },
        async () => {
            const category = 'Electronics';
            const response = await productAPI.list({ category });
            expect(response.status()).toBe(200);
            const products = await response.json();
            expect(Array.isArray(products.products)).toBe(true);
            expect(products.products.length).toBeGreaterThan(0);
            for (const product of products.products) {
                expect(product.category).toBe(category);
            }
        },
    );

    test(
        'Product Query: product sorting should return products in correct order',
        { tag: '@sanity' },
        async () => {
            const sort = 'price-asc';
            const response = await productAPI.list({ sort });
            expect(response.status()).toBe(200);
            const products = await response.json();
            expect(Array.isArray(products.products)).toBe(true);
            expect(products.products.length).toBeGreaterThan(0);
            for (let i = 1; i < products.products.length; i++) {
                expect(products.products[i].price).toBeGreaterThanOrEqual(
                    products.products[i - 1].price,
                );
            }
        },
    );

    test(
        'Product Query: pagination should return a different slice per page',
        { tag: '@sanity' },
        async () => {
            const query = { sort: 'price-asc', limit: 5 };
            const firstResponse = await productAPI.list({ ...query, page: 1 });
            const secondResponse = await productAPI.list({ ...query, page: 2 });
            expect(firstResponse.status()).toBe(200);
            expect(secondResponse.status()).toBe(200);

            const firstPage = await firstResponse.json();
            const secondPage = await secondResponse.json();

            expect(firstPage.page).toBe(1);
            expect(secondPage.page).toBe(2);
            expect(firstPage.limit).toBe(query.limit);
            expect(firstPage.total).toBe(secondPage.total);
            expect(firstPage.pages).toBe(Math.ceil(firstPage.total / query.limit));

            expect(firstPage.products).toHaveLength(query.limit);
            expect(secondPage.products.length).toBeGreaterThan(0);
            expect(secondPage.products.length).toBeLessThanOrEqual(query.limit);

            const lastOnFirstPage = firstPage.products[firstPage.products.length - 1].price;
            expect(secondPage.products[0].price).toBeGreaterThanOrEqual(lastOnFirstPage);
        },
    );

    test('Product Query: limit caps the page size', async () => {
        const response = await productAPI.list({ limit: 1 });
        expect(response.status()).toBe(200);
        const products = await response.json();
        expect(products.limit).toBe(1);
        expect(products.products).toHaveLength(1);
    });

    test('Product Query: invalid sort value should be rejected', async () => {
        const response = await productAPI.list({ sort: 'not-a-sort' });
        expect(response.status()).toBe(400);
    });

    test('should get product categories', { tag: '@sanity' }, async () => {
        const response = await productAPI.getCategories();
        expect(response.status()).toBe(200);
        const categories = await response.json();
        expect(Array.isArray(categories)).toBe(true);
    });

    test('should get product by ID', { tag: '@sanity' }, async () => {
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

adminContext.describe('Product Management Tests', { tag: ['@api', '@catalog', '@admin'] }, () => {
    adminContext.describe.configure({ mode: 'serial' });

    let productAPI: ProductAPI;
    let id: string;

    adminContext.beforeEach(({ adminRequest }) => {
        productAPI = new ProductAPI(adminRequest);
    });

    adminContext('should create a new product', { tag: '@sanity' }, async () => {
        const newProduct = validProduct();
        const response = await productAPI.create(newProduct);
        expect(response.status()).toBe(201);
        const createdProduct = await response.json();
        expect(createdProduct.name).toBe(newProduct.name);
        id = createdProduct._id;
    });

    adminContext('should update an existing product', { tag: '@sanity' }, async () => {
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

    adminContext('should delete a product', { tag: '@sanity' }, async () => {
        const response = await productAPI.remove(id);
        expect(response.status()).toBe(200);

        const getResponse = await productAPI.getById(id);
        expect(getResponse.status()).toBe(404);
    });
});

adminContext.describe('Product Create Validation', { tag: ['@api', '@catalog', '@admin'] }, () => {
    for (const { label, payload } of PRODUCT_CREATE_CASES) {
        adminContext(`create should reject ${label}`, async ({ adminRequest }) => {
            const productAPI = new ProductAPI(adminRequest);
            const response = await productAPI.create(payload);
            expect(response.status()).toBe(400);
        });
    }
});

test.describe('Product Management Tests (unauthenticated)', { tag: ['@api', '@catalog'] }, () => {
    let productAPI: ProductAPI;

    test.beforeEach(({ request }) => {
        productAPI = new ProductAPI(request);
    });

    test('unauthenticated should not create a product', async () => {
        const response = await productAPI.create(validProduct());
        expect(response.status()).toBe(401);
    });
});

userContext.describe(
    'Product Management Tests (non-admin user)',
    { tag: ['@api', '@catalog'] },
    () => {
        let productAPI: ProductAPI;

        userContext.beforeEach(({ userRequest }) => {
            productAPI = new ProductAPI(userRequest);
        });

        userContext('non-admin should not create a product', async () => {
            const response = await productAPI.create(validProduct());
            expect(response.status()).toBe(403);
        });
    },
);
