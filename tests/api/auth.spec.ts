import { test, expect } from '@playwright/test';
import { AuthAPI } from '../../api/AuthAPI';
import { INVALID_LOGINS, INVALID_REGISTRATIONS } from '../../data/auth';

test.describe('Auth Login/Logout', { tag: ['@api', '@auth'] }, () => {
    let authAPI: AuthAPI;

    test.beforeEach(async ({ request }) => {
        authAPI = new AuthAPI(request);
    });

    test('should login successfully with valid credentials', { tag: '@smoke' }, async () => {
        const response = await authAPI.login('user@demo.com', 'user123');
        expect(response.status()).toBe(200);

        const headers = response.headers();
        expect(headers['set-cookie']).toBeDefined();
        expect(headers['set-cookie']).toContain('token');
    });

    test('should fail login with invalid credentials', async () => {
        const response = await authAPI.login('invalid@demo.com', 'invalidpassword');
        expect(response.status()).toBe(401);

        const responseBody = await response.text();
        expect(responseBody).toContain('Invalid email or password');

        const headers = response.headers();
        expect(headers['set-cookie']).toBeUndefined();
    });

    test('should logout successfully', { tag: '@sanity' }, async () => {
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

test.describe('Auth Register', { tag: ['@api', '@auth'] }, () => {
    let authAPI: AuthAPI;
    const id = Date.now();

    test.beforeEach(async ({ request }) => {
        authAPI = new AuthAPI(request);
    });

    test('should register successfully with valid data', { tag: '@sanity' }, async () => {
        const response = await authAPI.register(`New User ${id}`, `newuser${id}@demo.com`, 'newuser123');
        expect(response.status()).toBe(201);
    });

    test('should fail register with existing email', async () => {
        const response = await authAPI.register('Duplicate User', `user@demo.com`, 'user123');
        expect(response.status()).toBe(409);
        const responseBody = await response.text();
        expect(responseBody).toContain('Email already registered');
    });
});

test.describe('Auth Validation', { tag: ['@api', '@auth'] }, () => {
    let authAPI: AuthAPI;

    test.beforeEach(async ({ request }) => {
        authAPI = new AuthAPI(request);
    });

    for (const { label, payload } of INVALID_LOGINS) {
        test(`login should reject ${label}`, async () => {
            const response = await authAPI.loginRaw(payload);
            expect(response.status()).toBe(400);
        });
    }

    for (const { label, payload } of INVALID_REGISTRATIONS) {
        test(`register should reject ${label}`, async () => {
            const response = await authAPI.registerRaw(payload);
            expect(response.status()).toBe(400);
        });
    }
});
