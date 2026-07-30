import { test as base, BrowserContext } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
// import fs from 'fs';
// import path from 'path';

export type TestRole = 'user' | 'admin';

const ROLES: readonly TestRole[] = ['user', 'admin'];

/** Reads TEST_ROLE (default 'user') and fails loudly on a typo instead of silently. */
function resolveRole(): TestRole {
    const raw = (process.env.TEST_ROLE ?? 'user').trim().toLowerCase();
    if (!ROLES.includes(raw as TestRole)) {
        throw new Error(
            `TEST_ROLE must be one of ${ROLES.join(' | ')} — got "${process.env.TEST_ROLE}".`
        );
    }
    return raw as TestRole;
}

/** Credentials come from `.env` as <ROLE>_EMAIL / <ROLE>_PASSWORD — never hardcoded here. */
export function credentialsFor(role: TestRole) {
    const prefix = role.toUpperCase();
    const email = process.env[`${prefix}_EMAIL`];
    const password = process.env[`${prefix}_PASSWORD`];

    if (!email || !password) {
        throw new Error(
            `Missing ${prefix}_EMAIL / ${prefix}_PASSWORD. Copy .env.example to .env and fill them in.`
        );
    }
    return { email, password };
}

/** The role this run authenticates as. Specs can import it for role-aware assertions. */
export const testRole: TestRole = resolveRole();

export const test = base.extend<object, { authenticatedContext: BrowserContext }>({
    authenticatedContext: [
        async ({ browser }, use) => {
            const { email, password } = credentialsFor(testRole);
            const context = await browser.newContext();
            const page = await context.newPage();

            const auth = new LoginPage(page);
            await auth.gotoLoginPage();
            await auth.login(email, password);
            await auth.waitForLoggedIn();

            await page.close();
            await use(context);
            await context.close();
        },
        { scope: 'worker' },
    ],
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
