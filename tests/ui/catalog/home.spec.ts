import { test, expect } from '../../../fixtures/base.fixture';
import { HomePage } from '../../../pages/HomePage';


test.describe('Home Page', () => {
    let homePage: HomePage;

    test.beforeEach(async ({ page }) => {
        homePage = new HomePage(page);
        await homePage.gotoHomePage();
    })

    test('Grid renders seeded products', async () => {
        await homePage.product_card.first().waitFor({ state: 'attached' });
        const productCount = await homePage.product_card.count();
        expect(productCount).toBeGreaterThan(0);
    })

    test('Search for a product', async () => {
        await homePage.search.fill('Bass Drop Earbuds');
        await homePage.search_submit.click();
        await expect(homePage.product_card).toHaveCount(1);
    })

    test('Search for a non-existent product', async () => {
        await homePage.search.fill('NonExistentProduct');
        await homePage.search_submit.click();
        await expect(homePage.product_card).toHaveCount(0);
        await expect(homePage.empty_state).toHaveText('No products found.');
    })

    test('Filter by category', async () => {
        await homePage.category_filter.selectOption('Gaming');
        const filteredProduct = await homePage.product_card_category.allTextContents()
        expect(filteredProduct.every(category => category === 'Gaming')).toBe(true);
    })

    test('Sort by price (low to high)', async () => {
        const beforeSortFilter = await homePage.product_card_price.first().textContent();
        await homePage.product_sort.selectOption('Price: Low to High');
        const afterSortFilter = await homePage.product_card_price.first().textContent();
        expect(beforeSortFilter).not.toEqual(afterSortFilter);
    })

    test('Pagination: Navigate to next page', async ({ page }) => {
        await homePage.page_next.click();
        await expect(page).toHaveURL('/?page=2');
        await expect(homePage.page_next).toBeDisabled();
        await expect(homePage.page_prev).toBeEnabled();
    })

    test('Pagination: Navigate to previous page', async ({ page }) => {
        await homePage.page_next.click();
        await expect(page).toHaveURL('/?page=2');
        await homePage.page_prev.click();
        await expect(page).toHaveURL('/');
        await expect(homePage.page_prev).toBeDisabled();
        await expect(homePage.page_next).toBeEnabled();
    })

    test('Reloading the page retains the current state', async ({ page }) => {
        await homePage.search.fill('Bass Drop Earbuds');
        await homePage.search_submit.click();
        await expect(homePage.product_card).toHaveCount(1);

        await page.reload();
        await expect(homePage.product_card).toHaveCount(1);
        await expect(page).toHaveURL('/?keyword=Bass+Drop+Earbuds');

        await homePage.nav_brand.click();
        await expect(page).toHaveURL('/');

        await homePage.category_filter.selectOption('Gaming');
        await expect(page).toHaveURL('/?category=Gaming');

        await page.reload();
        await expect(page).toHaveURL('/?category=Gaming');
    })
})