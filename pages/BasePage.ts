import { Page, Locator } from "@playwright/test";

export class BasePage {
    readonly page: Page;
    readonly navbar_name: Locator;
    readonly nav_admin: Locator;
    readonly add_to_cart_button: Locator;
    readonly add_to_cart_success: Locator;
    readonly nav_brand: Locator;
    readonly product_card: Locator;
    readonly nav_cart: Locator;
    readonly nav_cart_count: Locator;

    constructor(page: Page) {
        this.page = page;
        this.navbar_name = page.getByTestId('nav-username');
        this.nav_admin = page.getByTestId('nav-admin');
        this.add_to_cart_button = page.getByRole('button', { name: 'Add to cart' });
        this.add_to_cart_success = page.getByText('Added');
        this.nav_brand = page.getByTestId('nav-brand');
        this.product_card = page.getByTestId('product-card');
        this.nav_cart = page.getByTestId('nav-cart')
        this.nav_cart_count = page.getByTestId('nav-cart-count');
    }

    async waitForLoggedIn() {
        await this.navbar_name.waitFor({ state: 'visible' });
    }

    async goto(path: string) {
        await this.page.goto(path);
    }

    async addProduct(){
        const product = this.product_card.filter({ hasText: "Raptor Gaming Mouse" })
        await product.getByRole('button', { name: 'Add to cart' }).click()
    }
}