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
    readonly search: Locator;
    readonly search_submit: Locator;
    readonly cart_checkout: Locator;
    readonly cart_clear: Locator;
    readonly nav_orders: Locator;
    readonly order_detail: Locator;
    readonly nav_profile: Locator;
    readonly logoutButton: Locator;
    readonly loginStatusButton: Locator;
    readonly checkout_place_order: Locator;

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
        this.search = page.getByLabel('Search products');
        this.search_submit = page.getByTestId('search-submit')
        this.cart_checkout = page.getByTestId('cart-checkout');
        this.cart_clear = page.getByTestId('cart-clear');
        this.nav_orders = page.getByTestId('nav-orders');
        this.order_detail = page.getByTestId('order-detail');
        this.nav_profile = page.getByTestId('nav-profile')
        this.logoutButton = page.getByTestId('nav-logout');
        this.loginStatusButton = page.getByTestId('nav-login');
        this.checkout_place_order = page.getByTestId('checkout-place-order');
    }

    async waitForLoggedIn() {
        await this.navbar_name.waitFor({ state: 'visible' });
    }

    async goto(path: string) {
        await this.page.goto(path);
    }

    async searchProduct(productName: string) {
        await this.search.fill(productName);
        await this.search_submit.click();
    }

    async addToCart(productName: string) {
        await this.searchProduct(productName);
        const product = this.product_card.filter({ hasText: productName })
        await product.getByRole('button', { name: 'Add to cart' }).click()
    }

    async goToCart() {
        await this.nav_cart.click();
    }
}