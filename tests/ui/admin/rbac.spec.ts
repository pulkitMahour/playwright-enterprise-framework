import { test, expect } from '@playwright/test';
import { LoginPage } from '../../../pages/LoginPage';

test.describe('rbac Page', () => {
    test('RBAC test with user credentials', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.gotoLoginPage();
        await loginPage.login("user@demo.com", "user123");
        await expect(page).toHaveURL('/');
        await page.goto('/admin');
        await expect(page).toHaveURL('/');
        await expect(loginPage.nav_admin).toBeHidden();
    });
});