import { type Page } from '@playwright/test';
import { test, expect } from '../../../fixtures/auth.fixture';
import { OrderPage } from '../../../pages/OrderPage';
import { CheckoutPage } from '../../../pages/CheckoutPage';

const orderShipping = {
    product: 'Nebula RGB Mousepad',
    fullName: 'Test User',
    street: '42 Market St-12',
    city: 'Springfield-Marshal',
    postalCode: '5555599',
    country: 'Canada',
};

const EXPECTED_ITEM = { price: 19.99, qty: 1 };

test.describe('Order Page', () => {
    test.describe.configure({ mode: 'serial' })
    let page: Page;
    let orderPage: OrderPage;
    let checkoutPage: CheckoutPage;
    let id: string | null;

    test.beforeAll(async ({ freshUserContext }) => {
        page = await freshUserContext.newPage();
        await page.goto('/');
        await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30_000 });
        checkoutPage = new CheckoutPage(page);
    });

    test.beforeEach(async () => {
        orderPage = new OrderPage(page);
        await orderPage.goto('/');
    });

    test('Empty Order State', async () => {
        // must run before any order is placed
        await orderPage.nav_orders.click()
        await expect(orderPage.orders_empty).toBeVisible();
        await expect(orderPage.orders_empty).toHaveText('You have no orders yet. Start shopping');
    });

    test('Place an order and check in my orders list', async () => {
        await orderPage.placeOrder(orderShipping);
        id = await orderPage.order_detail.getAttribute('data-order-id');
        if (!id) throw new Error('Order ID not found');
        await orderPage.nav_orders.click();
        await expect(orderPage.orders_table).toBeVisible();
        await expect(orderPage.orders_table.locator(`[data-order-id="${id}"]`)).toBeVisible();
    });

    test('Verify the placed order details', async () => {
        await orderPage.nav_orders.click();
        if (!id) throw new Error('Order ID not found');
        await orderPage.orders_table.locator(`[data-order-id="${id}"]`).getByTestId('order-view').click();

        await expect(orderPage.order_detail).toBeVisible();
        await expect(orderPage.order_detail).toHaveAttribute('data-order-id', id)

        const item = orderPage.itemFor(orderShipping.product);
        await expect(item).toBeVisible();
        await expect(item).toContainText(`${EXPECTED_ITEM.qty} × $${EXPECTED_ITEM.price.toFixed(2)}`);

        const subtotal = EXPECTED_ITEM.price * EXPECTED_ITEM.qty;
        const calculate = checkoutPage.calculation(subtotal);
        await expect(orderPage.order_total).toHaveText(`$${calculate.total}`);

        await expect(orderPage.order_status).toHaveText('processing');
        await expect(orderPage.order_paid).toHaveText('Paid');

        await expect(orderPage.order_shipping).toContainText(orderShipping.fullName);
        await expect(orderPage.order_shipping).toContainText(orderShipping.street);
        await expect(orderPage.order_shipping).toContainText(orderShipping.city);
        await expect(orderPage.order_shipping).toContainText(orderShipping.postalCode);
        await expect(orderPage.order_shipping).toContainText(orderShipping.country);
    });
});
