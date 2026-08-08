import { type Page } from '@playwright/test';
import { test, expect } from '../../../fixtures/base.fixture';
import { LoginPage } from '../../../pages/LoginPage';

test.describe('rbac Page', { tag: ['@admin', '@auth'] }, () => {
    let page: Page;
    let loginPage: LoginPage;

    test.beforeAll(async ({ userContext }) => {
        page = await userContext.newPage();
        await page.goto('/');
        await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30_000 });
        loginPage = new LoginPage(page);
    });

    test('RBAC test with user credentials', { tag: '@smoke' }, async () => {
        await page.goto('/admin');
        await expect(page).toHaveURL('/');
        await expect(loginPage.nav_admin).toBeHidden();
    });
});