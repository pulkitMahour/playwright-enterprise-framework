import { Page, Locator } from "@playwright/test";
import { BasePage } from "./BasePage";

export class ProductPage extends BasePage {
    readonly product_detail: Locator;
    readonly product_title: Locator;
    readonly product_price: Locator;
    readonly product_stock: Locator;
    readonly product_rating: Locator;
    readonly product_description: Locator;
    readonly product_qty: Locator;
    readonly product_card_title: Locator;
    

    constructor(page: Page) {
        super(page);
        this.product_detail = page.getByTestId('product-detail');
        this.product_title = page.getByTestId('product-title');
        this.product_price = page.getByTestId('product-price');
        this.product_stock = page.getByTestId('product-stock');
        this.product_rating = page.getByTestId('product-rating');
        this.product_description = page.getByTestId('product-description');
        this.product_qty = page.getByTestId('product-qty');
        this.product_card_title = this.product_card.getByTestId('product-card-title');
    }
}