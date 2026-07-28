import {Page, Locator} from "@playwright/test";

export class BasePage {
    readonly page: Page;
    readonly navbar_name: Locator;
    readonly nav_admin: Locator;

    constructor(page: Page) {
        this.page = page;
        this.navbar_name = page.getByTestId('nav-username');
        this.nav_admin = page.getByTestId('nav-admin');
    }

    async waitForLoggedIn() {
        await this.navbar_name.waitFor({ state: 'visible' });
    }

    async goto(path: string) {
        await this.page.goto(path);
    }
}