import { test, expect } from '@playwright/test';
import { CartPage } from '../../../pages/CartPage';

test.describe('Cart Page', () => {
    let cartPage: CartPage;

    test.beforeEach(async ({page}) => {
        cartPage = new CartPage(page);
        await cartPage.goto('/');
    })

    test('Add product', async ({page}) => {
        cartPage.addProduct();
        await expect(cartPage.nav_cart_count).toHaveText('1')

        await cartPage.nav_cart.click();

    })

})