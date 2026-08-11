import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';
import { CheckoutPage } from './CheckoutPage';

export class OrderPage extends BasePage {
    readonly page: Page;
    readonly orders_empty: Locator;
    readonly orders_table: Locator;
    readonly order_row: Locator;
    readonly order_items: Locator;
    readonly order_item: Locator;
    readonly order_total: Locator;
    readonly order_status: Locator;
    readonly order_paid: Locator;
    readonly order_shipping: Locator;

    constructor(page: Page) {
        super(page);
        this.page = page;
        this.orders_empty = page.getByTestId('orders-empty');
        this.orders_table = page.getByTestId('orders-table');
        this.order_row = this.orders_table.getByTestId('order-row');
        this.order_items = page.getByTestId('order-items');
        this.order_item = this.order_items.getByTestId('order-item');
        this.order_total = page.getByTestId('order-total');
        this.order_status = page.getByTestId('order-status');
        this.order_paid = page.getByTestId('order-paid');
        this.order_shipping = page.getByTestId('order-shipping');
    }

    itemFor(productName: string): Locator {
        return this.order_item.filter({ hasText: productName });
    }

    async placeOrder(orderShipping: {
        product: string;
        fullName: string;
        street: string;
        city: string;
        postalCode: string;
        country: string;
    }) {
        await this.addToCart(orderShipping.product);
        await this.goToCart();
        await this.cart_checkout.click();
        const checkoutPage = new CheckoutPage(this.page);
        await checkoutPage.fillShippingAddress(orderShipping);
        await checkoutPage.checkout_place_order.click();
    }
}
