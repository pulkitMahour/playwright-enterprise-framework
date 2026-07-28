import { test, expect } from '../../../fixtures/base.fixture';
import { HomePage } from '../../../pages/HomePage';


test.describe('Home Page', () => {

    // test('Grid renders seeded products', async ({  authenticatedContext }) => {
    //     let page = await authenticatedContext.newPage()
        
    //     await page.goto('/');
    //     const homePage = new HomePage(page)
    //     await page.waitForTimeout(5000)
    //     await expect(homePage.product_grid).toBeVisible();
    //     // const a = homePage.product_grid
    //     // const b = homePage.product_card
    //     // console.log(await a.textContent());
    //     // console.log(await b.textContent());
    // })

    test('Grid renders seeded products', async ({page}) => {
        await page.goto('/');
        const homePage = new HomePage(page)
        await expect(homePage.product_grid).toBeVisible();
    })
})