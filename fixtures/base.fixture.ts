import { test as base, APIRequestContext, Browser, BrowserContext } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { adminApiFixture, credentialsFor } from './testData';
// import fs from 'fs';
// import path from 'path';

export type TestRole = 'user' | 'admin';

const ROLES: readonly TestRole[] = ['user', 'admin'];

function resolveRole(): TestRole {
    const raw = (process.env.TEST_ROLE ?? 'user').trim().toLowerCase();
    if (!ROLES.includes(raw as TestRole)) {
        throw new Error(
            `TEST_ROLE must be one of ${ROLES.join(' | ')} — got "${process.env.TEST_ROLE}".`
        );
    }
    return raw as TestRole;
}

export const testRole: TestRole = resolveRole();

function contextForRole(role: TestRole) {
    return async (
        { browser }: { browser: Browser },
        use: (context: BrowserContext) => Promise<void>,
    ) => {
        const { email, password } = credentialsFor(role);
        const context = await browser.newContext();
        const page = await context.newPage();

        const auth = new LoginPage(page);
        await auth.gotoLoginPage();
        await auth.login(email, password);
        await auth.waitForLoggedIn();

        await page.close();
        await use(context);
        await context.close();
    };
}

export const test = base.extend<object, {
    authenticatedContext: BrowserContext;
    adminContext: BrowserContext;
    userContext: BrowserContext;
    adminApi: APIRequestContext;
}>({
    authenticatedContext: [contextForRole(testRole), { scope: 'worker' }],

    adminContext: [contextForRole('admin'), { scope: 'worker' }],

    userContext: [contextForRole('user'), { scope: 'worker' }],

    adminApi: [adminApiFixture, { scope: 'worker' }],
});


// export const test = base.extend<{}, { workerStorageState: string }>({
//     storageState: ({ workerStorageState }, use) => use(workerStorageState),

//     workerStorageState: [async ({ browser }, use) => {
//         const { email, password } = credentialsFor(testRole);

//         const id = test.info().parallelIndex;
//         const fileName = path.resolve(
//             test.info().project.outputDir,
//             `.auth/${testRole}-${id}.json`
//         );

//         if (fs.existsSync(fileName)) {
//             await use(fileName);
//             return;
//         }

//         const context = await browser.newContext({
//             storageState: undefined,
//             baseURL: test.info().project.use.baseURL,
//         });
//         try {
//             const page = await context.newPage();
//             const auth = new LoginPage(page);
//             await auth.gotoLoginPage();
//             await auth.login(email, password);
//             await auth.waitForLoggedIn();

//             await context.storageState({ path: fileName });
//         } finally {
//             await context.close();
//         }
//         await use(fileName);
//     }, { scope: 'worker' }],
// });

export { expect } from '@playwright/test';
