import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class AdminPage extends BasePage {
    readonly admin_nav : Locator;
    readonly admin_nav_dashboard : Locator;
    readonly admin_nav_products : Locator;
    readonly admin_nav_orders : Locator;
    readonly admin_nav_users : Locator;
    readonly admin_stat_users : Locator;
    readonly admin_stat_products : Locator;
    readonly admin_stat_orders : Locator;
    readonly admin_stat_revenue : Locator;
    readonly admin_products_table: Locator;
    readonly admin_product_row: Locator;
    readonly product_create: Locator;
    readonly product_form: Locator;
    readonly product_form_name: Locator;
    readonly product_form_description: Locator;
    readonly product_form_category: Locator;
    readonly product_form_price: Locator;
    readonly product_form_stock: Locator;
    readonly product_form_image: Locator;
    readonly product_form_submit: Locator;
    readonly product_form_featured: Locator;
    readonly product_form_error: Locator;
    readonly admin_orders_table: Locator;
    readonly admin_order_row: Locator;
    readonly admin_users_table: Locator;
    readonly admin_user_row: Locator;
    readonly admin_user_delete: Locator;

    constructor(page: Page){
        super(page);
        this.admin_nav = page.getByTestId('admin-nav');
        this.admin_nav_dashboard = this.admin_nav.getByTestId('admin-nav-dashboard');
        this.admin_nav_products = this.admin_nav.getByTestId('admin-nav-products');
        this.admin_nav_orders = this.admin_nav.getByTestId('admin-nav-orders');
        this.admin_nav_users = this.admin_nav.getByTestId('admin-nav-users');
        this.admin_stat_users = page.getByTestId('admin-stat-users');
        this.admin_stat_products = page.getByTestId('admin-stat-products');
        this.admin_stat_orders = page.getByTestId('admin-stat-orders');
        this.admin_stat_revenue = page.getByTestId('admin-stat-revenue');
        this.admin_products_table = this.page.getByTestId('admin-products-table');
        this.admin_product_row = this.admin_products_table.getByTestId('admin-product-row');
        this.product_create = this.page.getByTestId('admin-product-create');
        this.product_form = this.page.getByTestId('admin-product-form');
        this.product_form_name = this.product_form.getByTestId('product-form-name');
        this.product_form_description = this.product_form.getByTestId('product-form-description');
        this.product_form_category = this.product_form.getByTestId('product-form-category');
        this.product_form_price = this.product_form.getByTestId('product-form-price');
        this.product_form_stock = this.product_form.getByTestId('product-form-stock');
        this.product_form_image = this.product_form.getByTestId('product-form-image');
        this.product_form_submit = this.product_form.getByTestId('product-form-submit');
        this.product_form_featured = this.product_form.getByTestId('product-form-featured');
        this.product_form_error = this.product_form.getByTestId('product-form-error');
        this.admin_orders_table = this.page.getByTestId('admin-orders-table');
        this.admin_order_row = this.admin_orders_table.getByTestId('admin-order-row');
        this.admin_users_table = this.page.getByTestId('admin-users-table');
        this.admin_user_row = this.admin_users_table.getByTestId('admin-user-row');
        this.admin_user_delete = this.admin_user_row.getByTestId('admin-user-delete');
    }

    rowFor(productName: string): Locator {
        return this.admin_product_row.filter({ hasText: productName });
    }

    async fillProductForm(product: {
        name: string;
        description: string;
        category: string;
        price: number;
        stock: number;
        image: string;
        featured: boolean;
    }) {
        await this.product_form_name.fill(product.name);
        await this.product_form_description.fill(product.description);
        await this.product_form_category.fill(product.category);
        await this.product_form_price.fill(product.price.toString());
        await this.product_form_stock.fill(product.stock.toString());
        await this.product_form_image.fill(product.image);
        if (product.featured) {
            await this.product_form_featured.check();
        } else {
            await this.product_form_featured.uncheck();
        }
    };
}
