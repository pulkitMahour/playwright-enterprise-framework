import { type Page } from '@playwright/test';
import { test, expect } from '../../../fixtures/base.fixture';
import { AdminPage } from '../../../pages/AdminPage';

const NEW_PRODUCT = {
    name: `Test Product ${Date.now()}`,
    description: 'This is a test product',
    category: 'Electronics',
    price: 99.99,
    stock: 10,
    image: '/images/placeholder.svg',
    featured: true
};

test.describe('Admin Page', () => {
    test.describe.configure({ mode: 'serial' })

    let page: Page;
    let adminPage: AdminPage;

    test.beforeAll(async ({ adminContext }) => {
        page = await adminContext.newPage();
        await page.goto('/');
        await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30_000 });
    });

    test.beforeEach(async () => {
        adminPage = new AdminPage(page);
        await expect(adminPage.nav_admin).toBeVisible();
        await adminPage.nav_admin.click();
        await expect(page).toHaveURL('/admin');
    });

    test.describe('Admin Dashboard', () => {
        test('Verify admin dashboard stats', async () => {
            await expect(adminPage.admin_stat_users).toBeVisible();
            await expect(adminPage.admin_stat_products).toBeVisible();
            await expect(adminPage.admin_stat_orders).toBeVisible();
            await expect(adminPage.admin_stat_revenue).toBeVisible();
        });
    });

    test.describe('Admin Products', () => {
        test('Verify admin products table', async () => {
            await adminPage.admin_nav_products.click();
            await expect(page).toHaveURL('/admin/products');
            await expect(adminPage.admin_products_table).toBeVisible();
            const productRowCount = await adminPage.admin_product_row.count();
            expect(productRowCount).toBeGreaterThan(0);
        });

        test('Verify product creation', async () => {
            await adminPage.admin_nav_products.click();
            await adminPage.product_create.click();
            await expect(adminPage.product_form).toBeVisible();
            await adminPage.fillProductForm(NEW_PRODUCT);
            await adminPage.product_form_submit.click();

            const createdRow = adminPage.rowFor(NEW_PRODUCT.name);
            await expect(createdRow).toBeVisible();

            await expect(createdRow.getByTestId('admin-product-seed-tag')).toHaveCount(0);
            await expect(createdRow.getByTestId('admin-product-delete')).toBeEnabled();
        });

        test('Verify product editing', async () => {
            await adminPage.admin_nav_products.click();
            const productRow = adminPage.rowFor(NEW_PRODUCT.name);
            await expect(productRow).toBeVisible();
            const editButton = productRow.getByTestId('admin-product-edit');
            await editButton.click();
            await expect(adminPage.product_form).toBeVisible();
            const updatedProduct = { ...NEW_PRODUCT, stock: 20, price: 79.99 };
            await adminPage.fillProductForm(updatedProduct);
            await adminPage.product_form_submit.click();

            await expect(productRow.locator('td').nth(2)).toHaveText(`$${updatedProduct.price.toFixed(2)}`);
            await expect(productRow.locator('td').nth(3)).toHaveText(updatedProduct.stock.toString());
        });

        test('Verify product deletion', async () => {
            await adminPage.admin_nav_products.click();
            const productRow = adminPage.rowFor(NEW_PRODUCT.name);
            await expect(productRow).toBeVisible();
            const deleteButton = productRow.getByTestId('admin-product-delete');

            page.once('dialog', async dialog => {
                expect(dialog.message()).toContain(NEW_PRODUCT.name);
                await dialog.accept();
            });
            await deleteButton.click();
            await expect(productRow).toHaveCount(0);
        });

        test('Verify product form error handling', async () => {
            await adminPage.admin_nav_products.click();
            await adminPage.product_create.click();
            await adminPage.fillProductForm({ ...NEW_PRODUCT, name: 'a' });
            await adminPage.product_form_submit.click();
            await expect(adminPage.product_form_error).toHaveText('name must be longer than or equal to 2 characters');
        });

        test('Verify seeded product cannot be deleted', async () => {
            await adminPage.admin_nav_products.click();
            const seededProductRow = adminPage.rowFor('Raptor Gaming Mouse');
            await expect(seededProductRow).toBeVisible();
            await expect(seededProductRow.getByTestId('admin-product-seed-tag')).toHaveText('default');
            await expect(seededProductRow.getByTestId('admin-product-delete')).toBeDisabled();
        });
    });

    test.describe('Admin Orders', () => {
        test('Verify admin orders table', async () => {
            await page.goto('/');
            await adminPage.addToCart('Raptor Gaming Mouse');
            await adminPage.goToCart();
            await adminPage.cart_checkout.click();
            await adminPage.checkout_place_order.click();

            await adminPage.nav_admin.click();
            await adminPage.admin_nav_orders.click();
            await expect(page).toHaveURL('/admin/orders');
            await expect(adminPage.admin_orders_table).toBeVisible();
            const orderRowCount = await adminPage.admin_order_row.count();
            expect(orderRowCount).toBeGreaterThan(0);
        });

        test('Verify change order status', async () => {
            await adminPage.admin_nav_orders.click();
            const firstOrderRow = adminPage.admin_order_row.first();
            const statusSelect = firstOrderRow.getByTestId('admin-order-status');
            const currentStatus = await statusSelect.inputValue();
            const newStatus = currentStatus === 'processing' ? 'shipped' : 'pending';
            await statusSelect.selectOption(newStatus);
            await expect(statusSelect).toHaveValue(newStatus);
        });
    });

    test.describe('Admin Users', () => {
        test('Verify admin users table', async () => {
            await adminPage.admin_nav_users.click();
            await expect(page).toHaveURL('/admin/users');
            await expect(adminPage.admin_users_table).toBeVisible();
            const userRowCount = await adminPage.admin_user_row.count();
            expect(userRowCount).toBeGreaterThan(0);
        });

        test('Verify seeded users protected from deletion', async () => {
            await adminPage.admin_nav_users.click();
            await expect(page).toHaveURL('/admin/users');
            const seededUserRow = adminPage.admin_user_row.filter({ hasText: 'admin@demo.com' });
            await expect(seededUserRow).toBeVisible();
            const deleteButton = seededUserRow.getByTestId('admin-user-delete');
            await expect(deleteButton).toBeDisabled();
        });
    });
});