import { test, expect } from '../../../fixtures/base.fixture';
import { CheckoutPage } from '../../../pages/CheckoutPage';

test.describe('Checkout Page', () => {
    let checkoutPage: CheckoutPage;

    test.beforeEach(async ({ page }, testInfo) => {
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

    test('Filling values in the checkout form and verify summary', async () => {
        await checkoutPage.checkout_fullname.fill('John Doe Yoda');
        await checkoutPage.checkout_street.fill('42 Market St-12');
        await checkoutPage.checkout_city.fill('Springfield-Marshal');
        await checkoutPage.checkout_postalCode.fill('5555599');
        await checkoutPage.checkout_country.fill('Canada');
        await expect(checkoutPage.checkout_summary).toBeVisible();
    })

    test('Verify summary math with shipping charges', async () => {
        const price = 44.99;
        const tax = ((price / 100) * 10).toFixed(2);
        const shipping = price < 100 ? (10).toFixed(2) : "0";
        const total = (Number(price) + Number(tax) + Number(shipping))

        await expect(checkoutPage.summary_items).toHaveText(`$${price}`);
        await expect(checkoutPage.summary_tax).toHaveText(`$${tax}`);
        await expect(checkoutPage.summary_shipping).toHaveText(`$${shipping}`);
        await expect(checkoutPage.summary_total).toHaveText(`$${total}`)
    })

    test('Shipping threshold over $100', async () => {
        const price = 199.99;
        const tax = ((price / 100) * 10).toFixed(2);
        const shipping = price < 100 ? (10).toFixed(2) : (0).toFixed(2);
        const total = (Number(price) + Number(tax) + Number(shipping))

        await expect(checkoutPage.summary_items).toHaveText(`$${price}`);
        await expect(checkoutPage.summary_tax).toHaveText(`$${tax}`);
        await expect(checkoutPage.summary_shipping).toHaveText(`$${shipping}`);
        await expect(checkoutPage.summary_total).toHaveText(`$${total}`)
    })
});