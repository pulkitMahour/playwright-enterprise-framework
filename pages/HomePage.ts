import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';


export class HomePage extends BasePage {
    readonly search: Locator;
    readonly search_submit: Locator;
    readonly category_filter: Locator;
    readonly product_sort: Locator;
    readonly page_next: Locator;
    readonly page_prev: Locator;
    readonly product_grid: Locator;
    readonly product_card: Locator;

    constructor(page: Page) {
        super(page);
        this.search = page.getByLabel('Search products');
        this.search_submit = page.getByTestId('search-submit')
        this.category_filter = page.getByTestId('category-filter');
        this.product_sort = page.getByTestId('sort-select');
        this.page_next = page.getByTestId('page-next');
        this.page_prev = page.getByTestId('page-prev');
        this.product_grid = page.getByTestId('product-grid');
        this.product_card = page.getByTestId('product-card');
    }

    async gotoHomePage() {
        await this.goto('/')
    }
};
