import { test as base, expect, type BrowserContext } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import fs from 'fs';
import path from 'path';

// export const test = base.extend<{authenticatedContext: BrowserContext }>({
//     authenticatedContext: async ({browser}, use) => {
//         const context = await browser.newContext();
//         const page = await context.newPage();
//         const auth = new LoginPage(page);
//         await auth.gotoLoginPage();
//         await auth.login("user@demo.com", "user123")
//         await page.close();
//         await use(context);
//         await context.close();
//     }
// })


export const test = base.extend<{}, { workerStorageState: string }>({
  storageState: ({ workerStorageState }, use) => use(workerStorageState),

  workerStorageState: [async ({ browser }, use) => {
    const id = test.info().parallelIndex;
    const fileName = path.resolve(test.info().project.outputDir, `.auth/${id}.json`);

    if (fs.existsSync(fileName)) {
      await use(fileName);
      return;
    }

    const page = await browser.newPage({ storageState: undefined, baseURL: test.info().project.use.baseURL });

    const auth = new LoginPage(page)
    await auth.gotoLoginPage();
    await auth.login("user@demo.com", "user123")
    

    await page.context().storageState({ path: fileName });
    // await page.close();
    await use(fileName);
    await page.close()
  }, { scope: 'worker' }],
});

export { expect } from '@playwright/test';