import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class CheckoutPage extends BasePage {
    readonly checkout_form: Locator;
    readonly checkout_fullname: Locator;
    readonly checkout_street: Locator;
    readonly checkout_city: Locator;
    readonly checkout_postalCode: Locator;
    readonly checkout_country: Locator;
    readonly checkout_summary: Locator;
    readonly summary_items: Locator;
    readonly summary_tax: Locator;
    readonly summary_shipping: Locator;
    readonly summary_total: Locator;
    readonly payment_note: Locator;
    readonly checkout_place_order: Locator;
    readonly order_detail: Locator;

    constructor(page: Page) {
        super(page);
        this.checkout_form = page.getByTestId('checkout-form');
        this.checkout_fullname = page.getByTestId('checkout-fullName');
        this.checkout_street = page.getByTestId('checkout-street');
        this.checkout_city = page.getByTestId('checkout-city');
        this.checkout_postalCode = page.getByTestId('checkout-postalCode');
        this.checkout_country = page.getByTestId('checkout-country');
        this.checkout_summary = page.getByTestId('checkout-summary');
        this.summary_items = page.getByTestId('summary-items');
        this.summary_tax = page.getByTestId('summary-tax');
        this.summary_shipping = page.getByTestId('summary-shipping');
        this.summary_total = page.getByTestId('summary-total');
        this.payment_note = page.getByTestId('payment-note');
        this.checkout_place_order = page.getByTestId('checkout-place-order');
        this.order_detail = page.getByTestId('order-detail');
    }

    calculation(price: number): { tax: string; shipping: string; total: string } {
        const taxNum = (price / 100) * 10;
        const shippingNum = price < 100 ? 10 : 0;
        const totalNum = price + taxNum + shippingNum;

        return {
            tax: taxNum.toFixed(2),
            shipping: shippingNum.toFixed(2),
            total: totalNum.toFixed(2)
        };
    }

    async clearCart(){
        const isCartVisible = await this.nav_cart_count.isVisible();
        if (isCartVisible){
            await this.nav_cart.click();
            await this.cart_clear.click();
        }
    }
};