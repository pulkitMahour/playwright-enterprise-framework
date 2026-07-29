import { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

export class LoginPage extends BasePage {
    readonly email: Locator;
    readonly password: Locator;
    readonly loginButton: Locator;
    readonly loginError: Locator;
    readonly loginSuccess: Locator;
    readonly logoutSuccess: Locator;
    readonly logoutButton: Locator;
    readonly loginStatusButton: Locator;

    constructor(page: Page) {
        super(page);
        this.email = page.getByTestId("login-email");
        this.password = page.getByTestId("login-password");
        this.loginButton = page.getByTestId("login-submit");
        this.loginError = page.getByTestId('login-error');
        this.loginSuccess = page.getByText('Welcome back')
        this.logoutButton = page.getByTestId('nav-logout');
        this.logoutSuccess = page.getByText('Logged out');
        this.loginStatusButton = page.getByTestId('nav-login');
    }

    async gotoLoginPage() {
        await this.goto('/login')
    }

    async login(email: string, password: string) {
        await this.email.fill(email);
        await this.password.fill(password)
        await this.loginButton.click();
    }
}
