import { request as apiRequest, APIRequestContext, WorkerInfo } from '@playwright/test';
import { OrderAPI } from '../api/OrderAPI';
import { ProductAPI } from '../api/ProductAPI';
import { UserAPI } from '../api/UserAPI';
import type { TestRole } from './base.fixture';

/* ---------------------------------- accounts --------------------------------- */

// The seeded demo accounts, read from `.env`.
export function credentialsFor(role: TestRole) {
    const prefix = role.toUpperCase();
    const email = process.env[`${prefix}_EMAIL`];
    const password = process.env[`${prefix}_PASSWORD`];

    if (!email || !password) {
        throw new Error(
            `Missing ${prefix}_EMAIL / ${prefix}_PASSWORD. Copy .env.example to .env and fill them in.`,
        );
    }
    return { email, password };
}

// Logs in over HTTP and returns the API context. No browser — the caller must dispose it.
export async function loginViaApi(baseURL: string, role: TestRole): Promise<APIRequestContext> {
    const { email, password } = credentialsFor(role);
    const context = await apiRequest.newContext({ baseURL });

    try {
        const response = await context.post('/api/auth/login', { data: { email, password } });
        if (!response.ok()) {
            throw new Error(
                `Login failed for ${email} (HTTP ${response.status()}). Is TestMart running at ${baseURL}?`,
            );
        }
    } catch (error) {
        await context.dispose();
        throw error;
    }

    return context;
}

export async function loginAsAdmin(workerInfo: WorkerInfo): Promise<APIRequestContext> {
    const baseURL = workerInfo.project.use.baseURL;
    if (!baseURL) throw new Error('baseURL is not set on the project — cannot reach the API.');

    return loginViaApi(baseURL, 'admin');
}

export async function adminApiFixture(
    {}: object,
    use: (api: APIRequestContext) => Promise<void>,
    workerInfo: WorkerInfo,
): Promise<void> {
    const api = await loginAsAdmin(workerInfo);
    await use(api);
    await api.dispose();
}

/* ---------------------------------- products --------------------------------- */

export type TestProduct = {
    _id: string;
    name: string;
    price: number;
    countInStock: number;
    category: string;
};

export type ProductOverrides = {
    name?: string;
    description?: string;
    price?: number;
    category?: string;
    countInStock?: number;
};

let sequence = 0;

// Unique per worker (pid) and per run (timestamp), so parallel specs never pick the same name.
function uniqueName(): string {
    return `Test Fixture ${Date.now()}-${process.pid}-${sequence++}`;
}

// Creates a throwaway product to order against, instead of draining a seeded one.
export async function createProduct(
    api: APIRequestContext,
    overrides: ProductOverrides = {},
): Promise<TestProduct> {
    const response = await new ProductAPI(api).create({
        name: uniqueName(),
        description: 'Disposable product created by the test suite',
        price: 49.99,
        category: 'Electronics',
        countInStock: 50,
        ...overrides,
    });

    if (response.status() !== 201) {
        throw new Error(
            `Could not create a test product (HTTP ${response.status()}): ${await response.text()}`,
        );
    }
    return response.json();
}

export async function deleteProduct(api: APIRequestContext, id: string): Promise<void> {
    await new ProductAPI(api).remove(id).catch(ignoreCleanupError);
}

export async function deleteProductsByName(api: APIRequestContext, name: string): Promise<void> {
    const response = await new ProductAPI(api).list({ keyword: name, limit: 50 });
    if (!response.ok()) return;

    const { products } = await response.json();
    for (const product of products) {
        await deleteProduct(api, product._id);
    }
}

/* ----------------------------------- orders ---------------------------------- */

export async function deleteOrders(api: APIRequestContext, ids: readonly string[]): Promise<void> {
    const orderAPI = new OrderAPI(api);

    for (const id of ids) {
        await orderAPI.remove(id).catch(ignoreCleanupError);
    }
}

/* ----------------------------------- users ----------------------------------- */

export async function deleteUsers(api: APIRequestContext, ids: readonly string[]): Promise<void> {
    const userAPI = new UserAPI(api);

    for (const id of ids) {
        await userAPI.remove(id).catch(ignoreCleanupError);
    }
}

export async function deleteUsersByEmail(
    api: APIRequestContext,
    emails: readonly string[],
): Promise<void> {
    if (!emails.length) return;

    const response = await new UserAPI(api).listAll();
    if (!response.ok()) return;

    const users: Array<{ id: string; email: string }> = await response.json();
    for (const user of users) {
        if (emails.includes(user.email)) {
            await deleteUsers(api, [user.id]);
        }
    }
}

function ignoreCleanupError(): void {}
