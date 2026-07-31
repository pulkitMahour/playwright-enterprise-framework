import { test as base, BrowserContext } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { RegisterPage } from '../pages/RegisterPage';
import { credentialsFor } from './base.fixture';

export const customLogin = base.extend<{ loginFixture: LoginPage }>({
    loginFixture: async ({ page }, use) => {
        const loginPage = new LoginPage(page);
        const { email, password } = credentialsFor('user');

        await loginPage.gotoLoginPage();
        await loginPage.login(email, password)
        await use(loginPage);
    }
})

export const customRegister = base.extend<{ registerFixture: RegisterPage }>({
    registerFixture: async ({ page }, use) => {
        const registerPage = new RegisterPage(page);

        await registerPage.gotoRegisterPage();
        await registerPage.register("Tiger", `tiger${Date.now()}@demo.com`, 'user123')
        await use(registerPage);
    }
})

export const test = base.extend<object, { authenticatedContext: BrowserContext }>({
    authenticatedContext: [
        async ({ browser }, use) => {
            const id = Date.now();
            const name = `tester-${id}`
            const email = `tester${id}@demo.com`
            const password = 'user123'
            const context = await browser.newContext();
            const page = await context.newPage();

            const auth = new RegisterPage(page);
            await auth.gotoRegisterPage();
            await auth.register(name, email, password);
            await auth.waitForLoggedIn();

            await page.close();
            await use(context);
            await context.close();
        },
        { scope: 'worker' },
    ],
});

export { expect } from '@playwright/test';