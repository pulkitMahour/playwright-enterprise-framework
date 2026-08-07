import { test, expect } from '@playwright/test';
import { HomePage } from '../../../pages/HomePage';
import { SEARCH_CASES, EMPTY_SEARCH_CASES } from '../../../data/search';


test.describe('Home Page', { tag: ['@catalog'] }, () => {
    let homePage: HomePage;

    test.beforeEach(async ({ page }) => {
        homePage = new HomePage(page);
        await homePage.gotoHomePage();
    })

    test('Grid renders seeded products', { tag: '@smoke' }, async () => {
        await homePage.product_card.first().waitFor({ state: 'attached' });
        const productCount = await homePage.product_card.count();
        expect(productCount).toBeGreaterThan(0);
    })

    for (const { label, keyword, expectedNames } of SEARCH_CASES) {
        test(`Search matches ${label}`, { tag: '@sanity' }, async () => {
            await homePage.search.fill(keyword);
            await homePage.search_submit.click();

            for (const name of expectedNames) {
                await expect(homePage.product_card.filter({ hasText: name })).toBeVisible();
            }
            await expect(homePage.product_card).not.toHaveCount(0);
        })
    }

    for (const { label, keyword } of EMPTY_SEARCH_CASES) {
        test(`Search finds nothing for ${label}`, async () => {
            await homePage.search.fill(keyword);
            await homePage.search_submit.click();
            await expect(homePage.product_card).toHaveCount(0);
            await expect(homePage.empty_state).toHaveText('No products found.');
        })
    }

    test('Filter by category', { tag: '@sanity' }, async () => {
        await homePage.category_filter.selectOption('Gaming');
        const filteredProduct = await homePage.product_card_category.allTextContents()
        expect(filteredProduct.every(category => category === 'Gaming')).toBe(true);
    })

    test('Sort by price (low to high)', { tag: '@sanity' }, async () => {
        const beforeSortFilter = await homePage.product_card_price.first().textContent();
        await homePage.product_sort.selectOption('Price: Low to High');
        const afterSortFilter = await homePage.product_card_price.first().textContent();
        expect(beforeSortFilter).not.toEqual(afterSortFilter);
    })

    test('Pagination: Navigate to next page', { tag: '@sanity' }, async ({ page }) => {
        await homePage.page_next.click();
        await expect(page).toHaveURL('/?page=2');
        await expect(homePage.page_next).toBeDisabled();
        await expect(homePage.page_prev).toBeEnabled();
    })

    test('Pagination: Navigate to previous page', { tag: '@sanity' }, async ({ page }) => {
        await homePage.page_next.click();
        await expect(page).toHaveURL('/?page=2');
        await homePage.page_prev.click();
        await expect(page).toHaveURL('/');
        await expect(homePage.page_prev).toBeDisabled();
        await expect(homePage.page_next).toBeEnabled();
    })

    test('Reloading the page retains the current state', { tag: '@sanity' }, async ({ page }) => {
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

test.describe('Home Page Network Failures', { tag: ['@catalog'] }, () => {
    let homePage: HomePage;

    test.beforeEach(async ({ page }) => {
        homePage = new HomePage(page);
    })

    test('Should display empty state when products API return 500', async ({ page }) => {
        await page.route((url) => url.pathname === '/api/products', async (route) => {
            await route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({ error: 'Internal Server Error' })
            });
        });
        await homePage.gotoHomePage();

        await expect(homePage.empty_state).toHaveText('No products found.');
        await expect(homePage.product_card).toHaveCount(0);
    });

    test('Should show loading spinner when product API is delayed', async ({ page }) => {
        await page.route((url) => url.pathname === '/api/products', async (route) => {
            await new Promise(resolve => setTimeout(resolve, 1000));
            await route.fulfill({
                status: 200,
                contentType: 'application/json',
                body: JSON.stringify({ products: [], page: 1, pages: 1, total: 0 }),
            });
        });
        await homePage.gotoHomePage();

        await expect(homePage.loading_state).toBeVisible();
        await expect(homePage.product_card).toHaveCount(0);
        await expect(homePage.loading_state).toBeHidden();
    });

    test('Should keep products grid working even if categories API fails with 500', async ({ page }) => {
        await page.route((url) => url.pathname === '/api/products/categories', async (route) => {
            await route.fulfill({
                status: 500,
                contentType: 'application/json',
                body: JSON.stringify({ error: 'Categories Fetch Failed' }),
            });
        });
        await homePage.gotoHomePage();

        await expect(homePage.product_card.first()).toBeVisible();
        expect(await homePage.product_card.count()).toBeGreaterThan(0);

        await expect(homePage.category_filter.locator('option')).toHaveText(['All categories']);
    });
});