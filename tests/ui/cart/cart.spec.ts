import { test, expect } from '@playwright/test';
import { CartPage } from '../../../pages/CartPage';

test.describe('Cart Page', { tag: ['@cart'] }, () => {
    let cartPage: CartPage;

    test.beforeEach(async ({ page }) => {
        cartPage = new CartPage(page);
        await cartPage.goto('/');
        await cartPage.addToCart('Raptor Gaming Mouse');
        await cartPage.goToCart();
        await expect(cartPage.cart_item).toBeVisible();
    })

    test('Add product', { tag: '@smoke' }, async () => {
        await expect(cartPage.cart_item_name).toHaveText('Raptor Gaming Mouse');
        await expect(cartPage.cart_item_price).toHaveText('$44.99');
    })

    test('Update product', { tag: '@sanity' }, async () => {
        await cartPage.cart_item_qty.fill('5');
        await expect(cartPage.cart_item_subtotal).toHaveText('$224.95');
        await expect(cartPage.cart_subtotal).toHaveText('$224.95');
        await expect(cartPage.nav_cart_count).toHaveText('5');
    })

    test('Cart Item Remove', { tag: '@sanity' }, async () => {
        await cartPage.cart_item_remove.click();
        await expect(cartPage.cart_item).toBeHidden();
        await expect(cartPage.cart_empty).toHaveText('Your cart is empty. Browse products');
        await expect(cartPage.nav_cart_count).toBeHidden();
    })

    test('Clear Cart', { tag: '@sanity' }, async () => {
        await cartPage.cart_clear.click();
        await expect(cartPage.cart_item).toBeHidden();
        await expect(cartPage.cart_empty).toHaveText('Your cart is empty. Browse products');
        await expect(cartPage.nav_cart_count).toBeHidden();
    })

    test('Cart persists across reload', { tag: '@sanity' }, async ({ page }) => {
        await expect(cartPage.nav_cart_count).toBeVisible();
        await page.reload();
        await expect(cartPage.nav_cart_count).toBeVisible();
        await expect(cartPage.cart_item).toBeVisible();
    })

})