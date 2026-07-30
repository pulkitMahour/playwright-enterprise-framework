import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';


export class HomePage extends BasePage {
    readonly category_filter: Locator;
    readonly product_sort: Locator;
    readonly page_next: Locator;
    readonly page_prev: Locator;
    readonly product_grid: Locator;
    readonly empty_state: Locator;
    readonly product_card_category: Locator;
    readonly product_card_price: Locator;

    constructor(page: Page) {
        super(page);
        this.category_filter = page.getByTestId('category-filter');
        this.product_sort = page.getByTestId('sort-select');
        this.page_next = page.getByTestId('page-next');
        this.page_prev = page.getByTestId('page-prev');
        this.product_grid = page.getByTestId('product-grid');
        this.empty_state = page.getByTestId('empty');
        this.product_card_category = this.product_card.locator('.product-card-category');
        this.product_card_price = this.product_card.getByTestId('product-card-price');
    }

    async gotoHomePage() {
        await this.goto('/')
    }
};
