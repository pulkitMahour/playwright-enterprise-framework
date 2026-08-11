import { BrowserContext } from '@playwright/test';
import { test as baseTest } from './base.fixture'; // built on base.fixture, so `adminApi` comes along
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { credentialsFor, deleteUsersByEmail } from './testData';

export const customLogin = baseTest.extend<{ loginFixture: LoginPage }>({
    loginFixture: async ({ page }, use) => {
        const loginPage = new LoginPage(page);
        const { email, password } = credentialsFor('user');

        await loginPage.gotoLoginPage();
        await loginPage.login(email, password);
        await use(loginPage);
    },
});

export const customRegister = baseTest.extend<{ registerFixture: RegisterPage }>({
    registerFixture: async ({ page, adminApi }, use) => {
        const registerPage = new RegisterPage(page);
        const email = `tiger${Date.now()}@demo.com`;

        await registerPage.gotoRegisterPage();
        await registerPage.register('Tiger', email, 'user123');
        await use(registerPage);

        await deleteUsersByEmail(adminApi, [email]);
    },
});

export const test = baseTest.extend<object, { freshUserContext: BrowserContext }>({
    freshUserContext: [
        async ({ browser, adminApi }, use) => {
            const id = Date.now();
            const name = `tester-${id}`;
            const email = `tester${id}@demo.com`;
            const password = 'user123';
            const context = await browser.newContext();
            const page = await context.newPage();

            const auth = new RegisterPage(page);
            await auth.gotoRegisterPage();
            await auth.register(name, email, password);
            await auth.waitForLoggedIn();

            await page.close();
            await use(context);
            await context.close();

            await deleteUsersByEmail(adminApi, [email]);
        },
        { scope: 'worker' },
    ],
});

export { expect } from '@playwright/test';
