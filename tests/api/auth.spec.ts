import { test, expect } from '@playwright/test';
import { AuthAPI } from '../../api/AuthAPI';

test.describe('Auth Login/Logout', () => {
    let authAPI: AuthAPI;

    test.beforeEach(async ({ request }) => {
        authAPI = new AuthAPI(request);
    });

    test('should login successfully with valid credentials', async () => {
        const response = await authAPI.login('user@demo.com', 'user123');
        expect(response.status()).toBe(200);

        const headers = response.headers();
        expect(headers['set-cookie']).toBeDefined();
        expect(headers['set-cookie']).toContain('token');
    });

    test('should fail login with invalid credentials', async () => {
        const response = await authAPI.login('invalid@demo.com', 'invalidpassword');
        expect(response.status()).toBe(401);

        const headers = response.headers();
        expect(headers['set-cookie']).toBeUndefined();
    });

    test('should logout successfully', async () => {
        const loginResponse = await authAPI.login('user@demo.com', 'user123');
        expect(loginResponse.status()).toBe(200);

        const logoutResponse = await authAPI.logout();
        expect(logoutResponse.status()).toBe(200);

        const headers = logoutResponse.headers();
        expect(headers['set-cookie']).toBeDefined();
        expect(headers['set-cookie']).toContain('token=;');

        const usersResponse = await authAPI.get('/users/me');
        expect(usersResponse.status()).toBe(401);
    });
});

test.describe('Auth Register', () => {
    test.describe.configure({ mode: 'serial' });
    let authAPI: AuthAPI;
    const id = Date.now();

    test.beforeEach(async ({ request }) => {
        authAPI = new AuthAPI(request);
    });

    test('should register successfully with valid data', async () => {
        const response = await authAPI.register(`New User ${id}`, `newuser${id}@demo.com`, 'newuser123');
        expect(response.status()).toBe(201);
    });

    test('should fail register with existing email', async () => {
        const response = await authAPI.register('New User', `newuser${id}@demo.com`, 'newuser123');
        expect(response.status()).toBe(409);
    });
});
