import { type Page } from '@playwright/test';
import { test, expect } from '../../../fixtures/auth.fixture';
import { test as pp } from '@playwright/test'
import { OrderPage } from '../../../pages/OrderPage';
import { LoginPage } from '../../../pages/LoginPage';
import { CheckoutPage } from '../../../pages/CheckoutPage';

const SHIPPING_ADDRESS = {
    product: 'Nebula RGB Mousepad',
    fullName: 'Test User',
    street: '42 Market St-12',
    city: 'Springfield-Marshal',
    postalCode: '5555599',
    country: 'Canada',
};

test.describe('Order Page', () => {
    let page: Page;
    let orderPage: OrderPage;
    let checkoutPage: CheckoutPage;
    let id: string | null;

    test.beforeAll(async ({ authenticatedContext }) => {
        page = await authenticatedContext.newPage();
        await page.goto('/');
        await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30_000 });
        checkoutPage = new CheckoutPage(page);
    });

    test.beforeEach(async () => {
        orderPage = new OrderPage(page);
        await orderPage.goto('/');
    });

    test('Empty Order State', async () => {
        await orderPage.nav_orders.click()
        await expect(orderPage.orders_empty).toBeVisible();
        await expect(orderPage.orders_empty).toHaveText('You have no orders yet. Start shopping')
    });

    test('Place an order and check in my orders list', async () => {
        await orderPage.placeOrder(SHIPPING_ADDRESS);
        id = await orderPage.order_detail.getAttribute('data-order-id');
        if (!id) throw new Error('Order ID not found');
        await orderPage.nav_orders.click();
        await expect(orderPage.orders_table).toBeVisible();
        // await expect(orderPage.orders_table.locator(`[data-order-id="${id}"]`)).toBeVisible();
        await expect(orderPage.order_row.filter({ hasText: id.slice(-8) })).toBeVisible();
    });

    test('Verify the placed order details', async () => {
        await orderPage.nav_orders.click();
        await orderPage.orders_table.locator(`[data-order-id="${id}"]`).getByTestId('order-view').click();

        if (!id) throw new Error('Order ID not found');
        await expect(orderPage.order_detail).toBeVisible();
        await expect(orderPage.order_detail).toHaveAttribute('data-order-id', id)

        const item = orderPage.order_items.filter({ hasText: SHIPPING_ADDRESS.product })
        await expect(item).toBeVisible();

        const price = Number((await item.locator('span').nth(1).innerText()).split('$')[1]);
        const calculate = checkoutPage.calculation(price);
        await expect(orderPage.order_total).toHaveText(`$${calculate.total}`);

        await expect(orderPage.order_status).toHaveText('processing');
        await expect(orderPage.order_paid).toHaveText('Paid');

        await expect(orderPage.order_shipping).toContainText(SHIPPING_ADDRESS.fullName);
        await expect(orderPage.order_shipping).toContainText(SHIPPING_ADDRESS.street);
        await expect(orderPage.order_shipping).toContainText(SHIPPING_ADDRESS.city);
        await expect(orderPage.order_shipping).toContainText(SHIPPING_ADDRESS.postalCode);
        await expect(orderPage.order_shipping).toContainText(SHIPPING_ADDRESS.country);
    })
});
