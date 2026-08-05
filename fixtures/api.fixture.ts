import { test as base, APIRequestContext, PlaywrightWorkerArgs, PlaywrightTestOptions } from '@playwright/test';
import { credentialsFor, TestRole } from './base.fixture';

function authenticatedContextForRole(role: TestRole) {
    return async (
        { playwright, baseURL }: PlaywrightWorkerArgs & PlaywrightTestOptions,
        use: (r: APIRequestContext) => Promise<void>,
    ) => {
        const { email, password } = credentialsFor(role);
        const context = await playwright.request.newContext({ baseURL });

        const loginResponse = await context.post('/api/auth/login', {
            data: { email, password }
        });

        if (!loginResponse.ok()) {
            throw new Error(`Login failed for email: ${email}. Status: ${loginResponse.status()}`);
        }

        await use(context);
        await context.dispose();
    };
}

export const test = base.extend<{
    userRequest: APIRequestContext;
    adminRequest: APIRequestContext;
}>({
    userRequest: authenticatedContextForRole('user'),
    adminRequest: authenticatedContextForRole('admin')
});

export { expect } from '@playwright/test';