import { type Page } from '@playwright/test';
import { test, expect } from '../../../fixtures/base.fixture';
import { CheckoutPage } from '../../../pages/CheckoutPage';

const SHIPPING_ADDRESS = {
    fullName: 'John Doe Yoda',
    street: '42 Market St-12',
    city: 'Springfield-Marshal',
    postalCode: '5555599',
    country: 'Canada',
};

test.describe('Checkout Page', { tag: ['@checkout'] }, () => {
    let page: Page;
    let checkoutPage: CheckoutPage;

    test.beforeAll(async ({authenticatedContext}) => {
        page = await authenticatedContext.newPage();
        await page.addInitScript(() => localStorage.removeItem('testmart_cart'));
        await page.goto('/');
        await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30_000 });
    })

    test.beforeEach(async ({}, testInfo) => {
        checkoutPage = new CheckoutPage(page);
        await checkoutPage.goto('/');
        if (testInfo.title.includes('Shipping threshold over $100')) {
            await checkoutPage.addToCart('Echo Studio Headphones');
            await checkoutPage.goToCart()
        } else {
            await checkoutPage.addToCart('Raptor Gaming Mouse');
            await checkoutPage.goToCart()
        }
        await checkoutPage.cart_checkout.click();
        await expect(page).toHaveURL('/checkout');
    })

    test('Filling values in the checkout form and verify summary', { tag: '@sanity' }, async () => {
        await expect(checkoutPage.checkout_form).toBeVisible();
        await checkoutPage.fillShippingAddress(SHIPPING_ADDRESS);
        await expect(checkoutPage.payment_note).toHaveText('Mock payment — no card required. Your order is marked paid instantly.')
        await expect(checkoutPage.checkout_summary).toBeVisible();
    })

    test('Verify summary math with shipping charges', { tag: '@sanity' }, async () => {
        const price = 44.99;
        const calculate = checkoutPage.calculation(price)

        await expect(checkoutPage.summary_items).toHaveText(`$${price}`);
        await expect(checkoutPage.summary_tax).toHaveText(`$${calculate.tax}`);
        await expect(checkoutPage.summary_shipping).toHaveText(`$${calculate.shipping}`);
        await expect(checkoutPage.summary_total).toHaveText(`$${calculate.total}`)
    })

    test('Shipping threshold over $100', async () => {
        const price = 199.99;
        const calculate = checkoutPage.calculation(price)

        await expect(checkoutPage.summary_items).toHaveText(`$${price}`);
        await expect(checkoutPage.summary_tax).toHaveText(`$${calculate.tax}`);
        await expect(checkoutPage.summary_shipping).toHaveText(`$${calculate.shipping}`);
        await expect(checkoutPage.summary_total).toHaveText(`$${calculate.total}`)
    })

    test('Place order verification', { tag: '@smoke' }, async () => {
        await checkoutPage.fillShippingAddress(SHIPPING_ADDRESS);
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
        await checkoutPage.checkout_street.fill('');
        await checkoutPage.checkout_place_order.click();
        await expect(checkoutPage.checkout_street).toHaveJSProperty('validity.valueMissing', true);
        await expect(page).toHaveURL('/checkout');
    })
});