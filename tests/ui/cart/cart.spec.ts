import { test, expect } from '@playwright/test';
import { CartPage } from '../../../pages/CartPage';

test.describe('Cart Page', () => {
    let cartPage: CartPage;

    test.beforeEach(async ({ page }) => {
        cartPage = new CartPage(page);
        await cartPage.goto('/');
    })

    test('Add product', async () => {
        await cartPage.addToCart();
        await expect(cartPage.cart_item).toBeVisible();
        await expect(cartPage.cart_item_name).toHaveText('Raptor Gaming Mouse');
        await expect(cartPage.cart_item_price).toHaveText('$44.99');
    })

    test('Update product', async () => {
        await cartPage.addToCart();
        await expect(cartPage.cart_item).toBeVisible();
        await cartPage.cart_item_qty.fill('5');
        await expect(cartPage.cart_item_subtotal).toHaveText('$224.95');
        await expect(cartPage.cart_subtotal).toHaveText('$224.95');
        await expect(cartPage.nav_cart_count).toHaveText('5');
    })

    test('Cart Item Remove', async () => {
        await cartPage.addToCart();
        await expect(cartPage.cart_item).toBeVisible();
        await cartPage.cart_item_remove.click();
        await expect(cartPage.cart_item).toBeHidden();
        await expect(cartPage.cart_empty).toHaveText('Your cart is empty. Browse products');
        await expect(cartPage.nav_cart_count).toBeHidden();
    })

    test('Clear Cart', async () => {
        await cartPage.addToCart();
        await expect(cartPage.cart_item).toBeVisible();
        await cartPage.cart_clear.click();
        await expect(cartPage.cart_item).toBeHidden();
        await expect(cartPage.cart_empty).toHaveText('Your cart is empty. Browse products');
        await expect(cartPage.nav_cart_count).toBeHidden();
    })

    test('Cart persists across reload', async ({ page }) => {
        await cartPage.addToCart();
        await expect(cartPage.nav_cart_count).toBeVisible();
        await page.reload();
        await expect(cartPage.nav_cart_count).toBeVisible();
        await expect(cartPage.cart_item).toBeVisible();
    })

})