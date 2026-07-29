import { test, expect } from '@playwright/test';
import { ProductPage } from '../../../pages/ProductPage';

test.describe('Product Page', () => {
    let productPage: ProductPage;

    test.beforeEach(async ({ page }) => {
        productPage = new ProductPage(page);
        await productPage.goto('/');
    });

    test('Product details are displayed correctly', async ({ page }) => {
        const product = productPage.product_card_title.filter({ hasText: "Vortex Mechanical Keyboard" })
        const href = await product.getAttribute('href');

        await product.click();
        await expect(page).toHaveURL(href!);
        await expect(productPage.product_detail).toBeVisible();
        await expect(productPage.product_title).toHaveText('Vortex Mechanical Keyboard');
        await expect(productPage.product_price).toHaveText('$119.99');
        await expect(productPage.product_stock).toHaveText('In stock: 22');
        await expect(productPage.product_rating).toHaveText('★ 4.8 (205 reviews)');
        await expect(productPage.product_description).toHaveText('Hot-swappable RGB mechanical keyboard with tactile switches.');
        await expect(productPage.product_qty).toHaveValue('1');
    });

    test('Add quantity and cart increment', async () => {
        const product = productPage.product_card_title.filter({ hasText: "Raptor Gaming Mouse" })

        await product.click()
        await productPage.product_qty.fill('5');
        await productPage.add_to_cart_button.click();
        await expect(productPage.add_to_cart_success).toBeVisible();
        await expect(productPage.nav_cart_count).toHaveText('5')
    })

    test('Out of stock Product', async () => {
        const product = productPage.product_card_title.filter({ hasText: "SoundWave Bluetooth Speaker" })

        await product.click()
        await expect(productPage.add_to_cart_button).toBeHidden();
        await expect(productPage.product_stock).toHaveText('Out of stock')
    })

    test('Add to cart from card grid', async () => {
        const product = productPage.product_card.filter({ hasText: "Raptor Gaming Mouse" })

        await product.getByRole('button', { name: 'Add to cart' }).click()
        await expect(productPage.add_to_cart_success).toBeVisible();
        await expect(productPage.nav_cart_count).toHaveText('1')
    })
});