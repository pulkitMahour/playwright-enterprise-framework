import { type Page, type Locator } from '@playwright/test';
import { test, expect } from '../../../fixtures/base.fixture';
import { CheckoutPage } from '../../../pages/CheckoutPage';
import { CHECKOUT_SUMMARY_CASES, DEFAULT_CART_PRODUCT } from '../../../data/shipping';
import { UI_ADDRESS_CASES, DEFAULT_SHIPPING_ADDRESS } from '../../../data/addresses';

test.describe('Checkout Page', { tag: ['@checkout'] }, () => {
    let page: Page;
    let checkoutPage: CheckoutPage;

    test.beforeAll(async ({ authenticatedContext }) => {
        page = await authenticatedContext.newPage();
        await page.addInitScript(() => localStorage.removeItem('testmart_cart'));
        await page.goto('/');
        await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30_000 });
    })

    test.beforeEach(async () => {
        checkoutPage = new CheckoutPage(page);
    })
    async function checkoutWith(product: string) {
        await checkoutPage.goto('/');
        await checkoutPage.addToCart(product);
        await checkoutPage.goToCart();
        await checkoutPage.cart_checkout.click();
        await expect(page).toHaveURL('/checkout');
    }

    test('Filling values in the checkout form and verify summary', { tag: '@sanity' }, async () => {
        await checkoutWith(DEFAULT_CART_PRODUCT);

        await expect(checkoutPage.checkout_form).toBeVisible();
        await checkoutPage.fillShippingAddress(DEFAULT_SHIPPING_ADDRESS);
        await expect(checkoutPage.payment_note).toHaveText('Mock payment — no card required. Your order is marked paid instantly.')
        await expect(checkoutPage.checkout_summary).toBeVisible();
    })

    for (const summary of CHECKOUT_SUMMARY_CASES) {
        test(`Summary totals ${summary.label}`, { tag: '@sanity' }, async () => {
            await checkoutWith(summary.product);

            await expect(checkoutPage.summary_items).toHaveText(`$${summary.price.toFixed(2)}`);
            await expect(checkoutPage.summary_tax).toHaveText(`$${summary.expectedTax.toFixed(2)}`);
            await expect(checkoutPage.summary_shipping).toHaveText(`$${summary.expectedShipping.toFixed(2)}`);
            await expect(checkoutPage.summary_total).toHaveText(`$${summary.expectedTotal.toFixed(2)}`);
        })
    }

    for (const { label, address } of UI_ADDRESS_CASES) {
        test(`Checkout form accepts ${label}`, async () => {
            await checkoutWith(DEFAULT_CART_PRODUCT);
            await checkoutPage.fillShippingAddress(address);

            const fields: Array<[Locator, string]> = [
                [checkoutPage.checkout_fullname, address.fullName],
                [checkoutPage.checkout_street, address.street],
                [checkoutPage.checkout_city, address.city],
                [checkoutPage.checkout_postalCode, address.postalCode],
                [checkoutPage.checkout_country, address.country],
            ];

            for (const [field, value] of fields) {
                await expect(field).toHaveValue(value);
                await expect(field).toHaveJSProperty('validity.valid', true);
            }
        })
    }

    test('Place order verification', { tag: '@smoke' }, async () => {
        await checkoutWith(DEFAULT_CART_PRODUCT);

        await checkoutPage.fillShippingAddress(DEFAULT_SHIPPING_ADDRESS);
        await checkoutPage.checkout_place_order.click();

        await expect(page).toHaveURL(/\/orders\/[a-f0-9]{24}$/);
        await expect(checkoutPage.order_detail).toBeVisible();
        await expect(checkoutPage.order_detail).toHaveAttribute(
            'data-order-id',
            page.url().split('/').pop()!
        );
        await expect(checkoutPage.nav_cart_count).toBeHidden();
    })

    test('Missing address field', async () => {
        await checkoutWith(DEFAULT_CART_PRODUCT);

        await checkoutPage.checkout_street.fill('');
        await checkoutPage.checkout_place_order.click();
        await expect(checkoutPage.checkout_street).toHaveJSProperty('validity.valueMissing', true);
        await expect(page).toHaveURL('/checkout');
    })
});
