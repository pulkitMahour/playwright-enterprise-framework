import { APIRequestContext } from '@playwright/test';
import { test as baseTest, TestRole } from './base.fixture';
import { loginViaApi } from './testData';

function apiContextFor(role: TestRole) {
    return async (
        { baseURL }: { baseURL?: string },
        use: (api: APIRequestContext) => Promise<void>,
    ) => {
        if (!baseURL) throw new Error('baseURL is not set on the project — cannot reach the API.');

        const api = await loginViaApi(baseURL, role);
        try {
            await use(api);
        } finally {
            await api.dispose();
        }
    };
}

export const test = baseTest.extend<{
    userRequest: APIRequestContext;
    adminRequest: APIRequestContext;
}>({
    userRequest: apiContextFor('user'),
    adminRequest: apiContextFor('admin'),
});

export { expect } from '@playwright/test';
