# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: ui/admin/admin.spec.ts >> Admin Page >> Admin Products >> Verify product editing
- Location: tests/ui/admin/admin.spec.ts:71:13

# Error details

```
Error: expect(locator).toHaveText(expected) failed

Locator:  getByTestId('admin-products-table').getByTestId('admin-product-row').filter({ hasText: 'Test Product 1786299219744' }).locator('td').nth(2)
Expected: "$79.99"
Received: "$99.99"
Timeout:  5000ms

Call log:
  - Expect "toHaveText" with timeout 5000ms
  - waiting for getByTestId('admin-products-table').getByTestId('admin-product-row').filter({ hasText: 'Test Product 1786299219744' }).locator('td').nth(2)
    12 × locator resolved to <td>$99.99</td>
       - unexpected value "$99.99"

```

```yaml
- cell "$99.99"
```

# Test source

```ts
  1   | import { type Page } from '@playwright/test';
  2   | import { test, expect } from '../../../fixtures/base.fixture';
  3   | import { AdminPage } from '../../../pages/AdminPage';
  4   | import { createProduct, deleteProduct, deleteOrders, deleteProductsByName, TestProduct } from '../../../fixtures/testData';
  5   | 
  6   | const NEW_PRODUCT = {
  7   |     name: `Test Product ${Date.now()}`,
  8   |     description: 'This is a test product',
  9   |     category: 'Electronics',
  10  |     price: 99.99,
  11  |     stock: 10,
  12  |     image: '/images/placeholder.svg',
  13  |     featured: true
  14  | };
  15  | 
  16  | test.describe('Admin Page', { tag: ['@admin'] }, () => {
  17  |     test.describe.configure({ mode: 'serial' })
  18  | 
  19  |     let page: Page;
  20  |     let adminPage: AdminPage;
  21  | 
  22  |     test.beforeAll(async ({ adminContext }) => {
  23  |         page = await adminContext.newPage();
  24  |         await page.goto('/');
  25  |         await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30_000 });
  26  |     });
  27  | 
  28  |     test.beforeEach(async () => {
  29  |         adminPage = new AdminPage(page);
  30  |         await expect(adminPage.nav_admin).toBeVisible();
  31  |         await adminPage.nav_admin.click();
  32  |         await expect(page).toHaveURL('/admin');
  33  |     });
  34  | 
  35  |     test.describe('Admin Dashboard', () => {
  36  |         test('Verify admin dashboard stats', { tag: '@smoke' }, async () => {
  37  |             await expect(adminPage.admin_stat_users).toBeVisible();
  38  |             await expect(adminPage.admin_stat_products).toBeVisible();
  39  |             await expect(adminPage.admin_stat_orders).toBeVisible();
  40  |             await expect(adminPage.admin_stat_revenue).toBeVisible();
  41  |         });
  42  |     });
  43  | 
  44  |     test.describe('Admin Products', () => {
  45  |         test.afterAll(async ({ adminApi }) => {
  46  |             await deleteProductsByName(adminApi, NEW_PRODUCT.name);
  47  |         });
  48  | 
  49  |         test('Verify admin products table', { tag: '@smoke' }, async () => {
  50  |             await adminPage.admin_nav_products.click();
  51  |             await expect(page).toHaveURL('/admin/products');
  52  |             await expect(adminPage.admin_products_table).toBeVisible();
  53  |             const productRowCount = await adminPage.admin_product_row.count();
  54  |             expect(productRowCount).toBeGreaterThan(0);
  55  |         });
  56  | 
  57  |         test('Verify product creation', { tag: '@sanity' }, async () => {
  58  |             await adminPage.admin_nav_products.click();
  59  |             await adminPage.product_create.click();
  60  |             await expect(adminPage.product_form).toBeVisible();
  61  |             await adminPage.fillProductForm(NEW_PRODUCT);
  62  |             await adminPage.product_form_submit.click();
  63  | 
  64  |             const createdRow = adminPage.rowFor(NEW_PRODUCT.name);
  65  |             await expect(createdRow).toBeVisible();
  66  | 
  67  |             await expect(createdRow.getByTestId('admin-product-seed-tag')).toHaveCount(0);
  68  |             await expect(createdRow.getByTestId('admin-product-delete')).toBeEnabled();
  69  |         });
  70  | 
  71  |         test('Verify product editing', { tag: '@sanity' }, async () => {
  72  |             await adminPage.admin_nav_products.click();
  73  |             const productRow = adminPage.rowFor(NEW_PRODUCT.name);
  74  |             await expect(productRow).toBeVisible();
  75  |             const editButton = productRow.getByTestId('admin-product-edit');
  76  |             await editButton.click();
  77  |             await expect(adminPage.product_form).toBeVisible();
  78  |             const updatedProduct = { ...NEW_PRODUCT, stock: 20, price: 79.99 };
  79  |             await adminPage.fillProductForm(updatedProduct);
  80  |             await adminPage.product_form_submit.click();
  81  | 
> 82  |             await expect(productRow.locator('td').nth(2)).toHaveText(`$${updatedProduct.price.toFixed(2)}`);
      |                                                           ^ Error: expect(locator).toHaveText(expected) failed
  83  |             await expect(productRow.locator('td').nth(3)).toHaveText(updatedProduct.stock.toString());
  84  |         });
  85  | 
  86  |         test('Verify product deletion', { tag: '@sanity' }, async () => {
  87  |             await adminPage.admin_nav_products.click();
  88  |             const productRow = adminPage.rowFor(NEW_PRODUCT.name);
  89  |             await expect(productRow).toBeVisible();
  90  |             const deleteButton = productRow.getByTestId('admin-product-delete');
  91  | 
  92  |             page.once('dialog', async dialog => {
  93  |                 expect(dialog.message()).toContain(NEW_PRODUCT.name);
  94  |                 await dialog.accept();
  95  |             });
  96  |             await deleteButton.click();
  97  |             await expect(productRow).toHaveCount(0);
  98  |         });
  99  | 
  100 |         test('Verify product form error handling', async () => {
  101 |             await adminPage.admin_nav_products.click();
  102 |             await adminPage.product_create.click();
  103 |             await adminPage.fillProductForm({ ...NEW_PRODUCT, name: 'a' });
  104 |             await adminPage.product_form_submit.click();
  105 |             await expect(adminPage.product_form_error).toHaveText('name must be longer than or equal to 2 characters');
  106 |         });
  107 | 
  108 |         test('Verify seeded product cannot be deleted', async () => {
  109 |             await adminPage.admin_nav_products.click();
  110 |             const seededProductRow = adminPage.rowFor('Raptor Gaming Mouse');
  111 |             await expect(seededProductRow).toBeVisible();
  112 |             await expect(seededProductRow.getByTestId('admin-product-seed-tag')).toHaveText('default');
  113 |             await expect(seededProductRow.getByTestId('admin-product-delete')).toBeDisabled();
  114 |         });
  115 |     });
  116 | 
  117 |     test.describe('Admin Orders', () => {
  118 |         let orderProduct: TestProduct;
  119 |         const createdOrders: string[] = [];
  120 | 
  121 |         test.beforeAll(async ({ adminApi }) => {
  122 |             orderProduct = await createProduct(adminApi);
  123 |         });
  124 | 
  125 |         test.afterAll(async ({ adminApi }) => {
  126 |             await deleteOrders(adminApi, createdOrders);
  127 |             await deleteProduct(adminApi, orderProduct._id);
  128 |         });
  129 | 
  130 |         test('Verify admin orders table', { tag: '@smoke' }, async () => {
  131 |             await page.goto('/');
  132 |             await adminPage.addToCart(orderProduct.name);
  133 |             await adminPage.goToCart();
  134 |             await adminPage.cart_checkout.click();
  135 |             await adminPage.checkout_place_order.click();
  136 | 
  137 |             await expect(adminPage.order_detail).toBeVisible();
  138 |             const orderId = await adminPage.order_detail.getAttribute('data-order-id');
  139 |             if (orderId) createdOrders.push(orderId);
  140 | 
  141 |             await adminPage.nav_admin.click();
  142 |             await adminPage.admin_nav_orders.click();
  143 |             await expect(page).toHaveURL('/admin/orders');
  144 |             await expect(adminPage.admin_orders_table).toBeVisible();
  145 |             const orderRowCount = await adminPage.admin_order_row.count();
  146 |             expect(orderRowCount).toBeGreaterThan(0);
  147 |         });
  148 | 
  149 |         test('Verify change order status', async () => {
  150 |             await adminPage.admin_nav_orders.click();
  151 |             const firstOrderRow = adminPage.admin_order_row.first();
  152 |             const statusSelect = firstOrderRow.getByTestId('admin-order-status');
  153 |             const currentStatus = await statusSelect.inputValue();
  154 |             const newStatus = currentStatus === 'processing' ? 'shipped' : 'pending';
  155 |             await statusSelect.selectOption(newStatus);
  156 |             await expect(statusSelect).toHaveValue(newStatus);
  157 |         });
  158 |     });
  159 | 
  160 |     test.describe('Admin Users', () => {
  161 |         test('Verify admin users table', { tag: '@sanity' }, async () => {
  162 |             await adminPage.admin_nav_users.click();
  163 |             await expect(page).toHaveURL('/admin/users');
  164 |             await expect(adminPage.admin_users_table).toBeVisible();
  165 |             const userRowCount = await adminPage.admin_user_row.count();
  166 |             expect(userRowCount).toBeGreaterThan(0);
  167 |         });
  168 | 
  169 |         test('Verify seeded users protected from deletion', async () => {
  170 |             await adminPage.admin_nav_users.click();
  171 |             await expect(page).toHaveURL('/admin/users');
  172 |             const seededUserRow = adminPage.admin_user_row.filter({ hasText: 'admin@demo.com' });
  173 |             await expect(seededUserRow).toBeVisible();
  174 |             const deleteButton = seededUserRow.getByTestId('admin-user-delete');
  175 |             await expect(deleteButton).toBeDisabled();
  176 |         });
  177 |     });
  178 | });
```