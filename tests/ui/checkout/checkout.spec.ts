import { type Page } from '@playwright/test';
import { test, expect } from '../../../fixtures/base.fixture';
import { CheckoutPage } from '../../../pages/CheckoutPage';

test.describe('Checkout Page', () => {
    let page: Page;
    let checkoutPage: CheckoutPage;

    test.beforeAll(async ({authenticatedContext}) => {
        page = await authenticatedContext.newPage();
        await page.goto('/');
        await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30_000 });
    })

    test.beforeEach(async ({}, testInfo) => {
        checkoutPage = new CheckoutPage(page);
        await checkoutPage.goto('/');
        if (testInfo.title.includes('Shipping threshold over $100')) {
            await checkoutPage.addToCart('Echo Studio Headphones');
        } else {
            await checkoutPage.addToCart('Raptor Gaming Mouse');
        }
        await checkoutPage.cart_checkout.click();
        await expect(page).toHaveURL('/checkout');
    })

    test.afterEach(async () => {
        await checkoutPage.clearCart();
    })

    test('Filling values in the checkout form and verify summary', async () => {
        await expect(checkoutPage.checkout_form).toBeVisible();
        await checkoutPage.checkout_fullname.fill('John Doe Yoda');
        await checkoutPage.checkout_street.fill('42 Market St-12');
        await checkoutPage.checkout_city.fill('Springfield-Marshal');
        await checkoutPage.checkout_postalCode.fill('5555599');
        await checkoutPage.checkout_country.fill('Canada');
        await expect(checkoutPage.payment_note).toHaveText('Mock payment — no card required. Your order is marked paid instantly.')
        await expect(checkoutPage.checkout_summary).toBeVisible();
    })

    test('Verify summary math with shipping charges', async () => {
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

    test('Place order verification', async () => {
        await checkoutPage.checkout_place_order.click();
        const order_id = await checkoutPage.order_detail.getAttribute('data-order-id');
        await expect(page).toHaveURL(`/orders/${order_id}`);
        await expect(checkoutPage.order_detail).toBeVisible()
        await expect(checkoutPage.nav_cart_count).toBeHidden();
    })

    test('Missing address field', async () => {
        await checkoutPage.checkout_street.fill('');
        await checkoutPage.checkout_place_order.click();
        await expect(checkoutPage.checkout_street).toHaveJSProperty('validity.valueMissing', true);
        await expect(page).toHaveURL('/checkout');
    })
});