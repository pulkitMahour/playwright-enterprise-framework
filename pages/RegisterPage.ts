import { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

export class RegisterPage extends BasePage {
    readonly name: Locator;
    readonly email: Locator;
    readonly password: Locator;
    readonly registerButton: Locator;
    readonly registerError: Locator;

    constructor(page: Page) {
        super(page);
        this.name = page.getByTestId("register-name");
        this.email = page.getByTestId("register-email");
        this.password = page.getByTestId("register-password");
        this.registerButton = page.getByTestId("register-submit");
        this.registerError = page.getByTestId('register-error');
    }

    async gotoRegisterPage() {
        await this.goto('/register')
    }

    async register(user: string, email: string, password: string) {
        await this.name.fill(user);
        await this.email.fill(email);
        await this.password.fill(password)
        await this.registerButton.click();
    }
}
