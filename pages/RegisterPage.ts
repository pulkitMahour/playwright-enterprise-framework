import { Page, Locator } from "@playwright/test";

export class RegisterPage {
    readonly page: Page;
    readonly name: Locator;
    readonly email: Locator;
    readonly password: Locator;
    readonly registerButton: Locator;
    readonly navbar_name: Locator;
    readonly registerError: Locator;

    constructor(page: Page) {
        this.page = page
        this.name = page.getByTestId("register-name");
        this.email = page.getByTestId("register-email");
        this.password = page.getByTestId("register-password");
        this.registerButton = page.getByTestId("register-submit");
        this.navbar_name = page.getByTestId('nav-username');
        this.registerError = page.getByTestId('register-error');
    }

    async gotoRegisterPage() {
        await this.page.goto('/register')
    }

    async register(user: string, email: string, password: string) {
        await this.name.fill(user);
        await this.email.fill(email);
        await this.password.fill(password)
        await this.registerButton.click();
    }
}