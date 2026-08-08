import { test, expect } from '@playwright/test';
import { ProductPage } from '../../../pages/ProductPage';

test.describe('Product Page', { tag: ['@catalog'] }, () => {
    let productPage: ProductPage;

    test.beforeEach(async ({ page }) => {
        productPage = new ProductPage(page);
        await productPage.goto('/');
    });

    test('Product details are displayed correctly', { tag: '@smoke' }, async ({ page }) => {
        await productPage.searchProduct('Vortex Mechanical Keyboard');
        const product = productPage.product_card_title.filter({ hasText: "Vortex Mechanical Keyboard" })
        const href = await product.getAttribute('href');

        await product.click();
        await expect(page).toHaveURL(href!);
        await expect(productPage.product_detail).toBeVisible();
        await expect(productPage.product_title).toHaveText('Vortex Mechanical Keyboard');
        await expect(productPage.product_price).toHaveText('$119.99');
        await expect(productPage.product_stock).toContainText('In stock:');
        await expect(productPage.product_rating).toHaveText('★ 4.8 (205 reviews)');
        await expect(productPage.product_description).toHaveText('Hot-swappable RGB mechanical keyboard with tactile switches.');
        await expect(productPage.product_qty).toHaveValue('1');
    });

    test('Add quantity and cart increment', { tag: '@sanity' }, async () => {
        await productPage.searchProduct('Raptor Gaming Mouse');
        const product = productPage.product_card_title.filter({ hasText: "Raptor Gaming Mouse" })

        await product.click()
        await productPage.product_qty.fill('5');
        await productPage.add_to_cart_button.click();
        await expect(productPage.add_to_cart_success).toBeVisible();
        await expect(productPage.nav_cart_count).toHaveText('5')
    })

    test('Out of stock Product', async () => {
        await productPage.searchProduct('SoundWave Bluetooth Speaker');
        const product = productPage.product_card_title.filter({ hasText: "SoundWave Bluetooth Speaker" })

        await product.click()
        await expect(productPage.add_to_cart_button).toBeHidden();
        await expect(productPage.product_stock).toHaveText('Out of stock')
    })

    test('Add to cart from card grid', { tag: '@sanity' }, async () => {
        await productPage.addToCart('Raptor Gaming Mouse');
        await productPage.goToCart();
        await expect(productPage.add_to_cart_success).toBeVisible();
        await expect(productPage.nav_cart_count).toHaveText('1')
    })
});

test.describe('Product Detail Page - Error Handling', { tag: ['@catalog'] }, () => {
    test('Should display not-found state and hide add-to-cart button when product API returns 500', async ({ page }) => {
        const productPage = new ProductPage(page);
        await productPage.goto('/');
        await productPage.searchProduct('Vortex Mechanical Keyboard');
        const product = productPage.product_card_title.filter({ hasText: "Vortex Mechanical Keyboard" })
        const href = await product.getAttribute('href');

        const id = href!.split('/').pop();
        await page.route((url) => url.pathname === `/api/products/${id}`, async (route) => {
            await route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({ error: 'Product details could not be fetched' }),
            });
        });

        await product.click();

        await expect(productPage.empty_state).toHaveText('Product not found.');
        await expect(productPage.product_detail).toBeHidden();
        await expect(productPage.add_to_cart_button).toBeHidden();
    });
});