import { test, expect } from '@playwright/test';
import { LoginPage } from '../../../pages/LoginPage';
import { customLogin } from '../../../fixtures/auth.fixture';

test.describe('Login Page', () => {
    customLogin('Login test with valid credentials', async ({ page, loginFixture }) => {

        await expect(page).toHaveURL('/');
        await expect(loginFixture.loginSuccess).toBeVisible();
        await expect(loginFixture.navbar_name).toHaveText('John Doe')
    });

    test('Login test with invalid credentials', async ({ page }) => {
        const loginPage = new LoginPage(page);

        await loginPage.gotoLoginPage();
        await loginPage.login("invalid@demo.com", "invalid123")

        await expect(loginPage.loginError).toHaveText('Invalid email or password')
        await expect(page).toHaveURL('/login');
    });

    customLogin('Logout', async ({page, loginFixture}) => {
        await expect(page).toHaveURL('/');

        await loginFixture.logoutButton.click();
        await expect(loginFixture.logoutSuccess).toBeVisible();
        await expect(loginFixture.loginStatusButton).toBeVisible();
        await expect(loginFixture.navbar_name).toBeHidden();
    })
});
