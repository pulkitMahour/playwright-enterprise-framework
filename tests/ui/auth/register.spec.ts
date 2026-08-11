import { test, expect } from '@playwright/test';
import { customRegister } from '../../../fixtures/auth.fixture';
import { RegisterPage } from '../../../pages/RegisterPage';

test.describe('Register Page', { tag: ['@auth'] }, () => {
    customRegister('register test', { tag: '@sanity' }, async ({ page, registerFixture }) => {
        await expect(page).toHaveURL('/');
        await expect(registerFixture.navbar_name).toHaveText('Tiger');
    });

    test('Register with same Credentials', async ({ page }) => {
        const registerPage = new RegisterPage(page);

        await registerPage.gotoRegisterPage();
        await registerPage.register('John Doe', `user@demo.com`, 'user123');

        await expect(registerPage.registerError).toHaveText('Email already registered');
        await expect(page).toHaveURL('/register');
    });
});
