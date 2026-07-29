import { test, expect } from '@playwright/test';
import { LoginPage } from '../../../pages/LoginPage';
import { customLogin } from '../../../fixtures/auth.fixture';

test.describe('Login Page', () => {
    customLogin('Login test with valid credentials', async ({ page, loginFixture }) => {

        await expect(page).toHaveURL('/');
        await expect(loginFixture.loginSuccess).toBeVisible();
        await expect(loginFixture.navbar_name).toHaveText('John Doe')
        await expect(loginFixture.nav_admin).toBeHidden();
    });

    test('Login test with invalid credentials', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.gotoLoginPage();
        await loginPage.login("invalid@demo.com", "invalid123")

        await expect(loginPage.loginError).toHaveText('Invalid email or password')
        await expect(page).toHaveURL('/login');
    });

    customLogin('Logout', async ({ page, loginFixture }) => {
        await expect(page).toHaveURL('/');

        await loginFixture.logoutButton.click();
        await expect(loginFixture.logoutSuccess).toBeVisible();
        await expect(loginFixture.loginStatusButton).toBeVisible();
        await expect(loginFixture.navbar_name).toBeHidden();
    })

    test('not an email', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.gotoLoginPage();
        await loginPage.login('not-an-email', 'user123');

        await expect(loginPage.email).toHaveJSProperty('validity.typeMismatch', true);
        await expect(page).toHaveURL('/login');
    });

    test('empty email', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.gotoLoginPage();
        await loginPage.login('', 'user123');

        await expect(loginPage.email).toHaveJSProperty('validity.valueMissing', true);
        await expect(page).toHaveURL('/login');
    });

    test('empty password', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.gotoLoginPage();
        await loginPage.login('user@demo.com', '');

        await expect(loginPage.password).toHaveJSProperty('validity.valueMissing', true);
        await expect(page).toHaveURL('/login');
    });

    test('admin login', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.gotoLoginPage();

        await loginPage.login('admin@demo.com', 'admin123');
        await expect(loginPage.loginSuccess).toBeVisible();
        await expect(loginPage.navbar_name).toHaveText('Admin User')
        await expect(loginPage.nav_admin).toBeVisible();
    });

    test('go to checkout without login', async ({ page }) => {
        const loginPage = new LoginPage(page);

        await page.goto('/checkout');
        await expect(page).toHaveURL('/login');

        await loginPage.login('user@demo.com', 'user123');
        await expect(page).toHaveURL('/checkout');
    });
});
