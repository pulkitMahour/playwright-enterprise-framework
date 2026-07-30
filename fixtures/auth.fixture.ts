import { test as base } from '@playwright/test';
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

export { expect } from '@playwright/test';