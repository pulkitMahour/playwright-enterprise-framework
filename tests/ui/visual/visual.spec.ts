import { test, expect } from '@playwright/test';
import { LoginPage } from '../../../pages/LoginPage';
import { RegisterPage } from '../../../pages/RegisterPage';
import { HomePage } from '../../../pages/HomePage';
import { OrderPage } from '../../../pages/OrderPage';
import { CartPage } from '../../../pages/CartPage';

test.describe('Login Page - Visual Regression', () => {
    test('Login page matches the baseline visual snapshot', { tag: ['@auth', '@visual'] }, async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.gotoLoginPage();
        await expect(page).toHaveScreenshot('login-page-baseline.png');
    });

});


test.describe('Register Page - Visual Regression', () => {
    test('Register page matches the baseline visual snapshot', { tag: ['@auth', '@visual'] }, async ({ page }) => {
        const registerPage = new RegisterPage(page);
        await registerPage.gotoRegisterPage();
        await expect(page).toHaveScreenshot('register-page-baseline.png');
    });

});

test.describe('Empty Page - Visual Regression', () => {
    test.beforeEach(async ({ page }) => {
        const registerPage = new RegisterPage(page);
        const snap = `${Date.now()}-${test.info().workerIndex}`;
        await registerPage.gotoRegisterPage();
        await registerPage.register('Visual User', `visualuser${snap}@demo.com`, "user123");
        await registerPage.waitForLoggedIn();
    });

    test('No product found matches the baseline visual snapshot', { tag: ['@catalog', '@visual'] }, async ({ page }) => {
        const homePage = new HomePage(page);
        await homePage.gotoHomePage();
        await homePage.search.fill('nonsense keyword');
        await homePage.search_submit.click();
        await expect(homePage.product_card).toHaveCount(0);

        await expect(page).toHaveScreenshot('empty-search-baseline.png');
    });

    test('Empty Order page matches the baseline visual snapshot', { tag: ['@orders', '@visual'] }, async ({ page }) => {
        const orderPage = new OrderPage(page);
        await orderPage.goto('/');
        await orderPage.nav_orders.click();
        await expect(orderPage.orders_empty).toBeVisible();

        await expect(page).toHaveScreenshot('empty-order-baseline.png');
    });

    test('Empty Cart page matches the baseline visual snapshot', { tag: ['@orders', '@visual'] }, async ({ page }) => {
        const cartPage = new CartPage(page);
        await cartPage.goto('/');
        await cartPage.nav_cart.click();
        await expect(cartPage.cart_empty).toBeVisible();

        await expect(page).toHaveScreenshot('empty-cart-baseline.png');
    });
});