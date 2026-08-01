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
    }

    calculation(price: number): { tax: string; shipping: string; total: string } {
        const taxNum = Math.round(price * 0.1 * 100) / 100;
        const shippingNum = price > 100 ? 0 : 10;
        const totalNum = Math.round((price + taxNum + shippingNum) * 100) / 100;

        return {
            tax: taxNum.toFixed(2),
            shipping: shippingNum.toFixed(2),
            total: totalNum.toFixed(2)
        };
    }

    async fillShippingAddress(address: {
        fullName: string;
        street: string;
        city: string;
        postalCode: string;
        country: string;
    }) {
        await this.checkout_fullname.fill(address.fullName);
        await this.checkout_street.fill(address.street);
        await this.checkout_city.fill(address.city);
        await this.checkout_postalCode.fill(address.postalCode);
        await this.checkout_country.fill(address.country);
    }
};