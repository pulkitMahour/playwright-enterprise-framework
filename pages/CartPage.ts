import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class CartPage extends BasePage {
    readonly cart_item: Locator;
    readonly cart_item_name: Locator;
    readonly cart_item_price: Locator;
    readonly cart_item_qty: Locator;
    readonly cart_item_remove: Locator;
    readonly cart_clear: Locator;
    readonly cart_subtotal: Locator;
    readonly cart_empty: Locator;
    readonly cart_item_subtotal: Locator;

    constructor(page: Page) {
        super(page);
        this.cart_item = page.getByTestId('cart-item');
        this.cart_item_qty = page.getByTestId('cart-item-qty');
        this.cart_item_remove = page.getByTestId('cart-item-remove');
        this.cart_clear = page.getByTestId('cart-clear');
        this.cart_subtotal = page.getByTestId('cart-subtotal');
        this.cart_empty = page.getByTestId('cart-empty');
        this.cart_item_subtotal = page.getByTestId('cart-item-subtotal');
        this.cart_item_name = page.getByTestId('cart-item-name');
        this.cart_item_price = page.getByTestId('cart-item-price');
    }
};