import { Page, Locator } from "@playwright/test";

export class LoginPage {
    readonly page: Page;
    readonly email: Locator;
    readonly password: Locator;
    readonly loginButton: Locator;
    readonly loginError: Locator;
    readonly loginSuccess: Locator;
    readonly logoutSuccess: Locator;
    readonly navbar_name: Locator;
    readonly logoutButton: Locator;
    readonly loginStatusButton: Locator;

    constructor(page: Page) {
        this.page = page
        this.email = page.getByTestId("login-email");
        this.password = page.getByTestId("login-password");
        this.loginButton = page.getByTestId("login-submit");
        this.loginError = page.getByTestId('login-error');
        this.loginSuccess = page.getByText('Welcome back')
        this.navbar_name = page.getByTestId('nav-username');
        this.logoutButton = page.getByTestId('nav-logout');
        this.logoutSuccess = page.getByText('Logged out');
        this.loginStatusButton = page.getByTestId('nav-login');
    }

    async gotoLoginPage() {
        await this.page.goto('/login')
    }

    async login(email: string, password: string) {
        await this.email.fill(email);
        await this.password.fill(password)
        await this.loginButton.click();
    }
}