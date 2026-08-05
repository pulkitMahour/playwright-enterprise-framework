import { test, expect } from '@playwright/test';
import { test as adminContext, test as userContext } from '../../fixtures/api.fixture';
import { UserAPI } from '../../api/UserAPI';
import { AuthAPI } from '../../api/AuthAPI';

let USER_DETAILS = {
    id: '',
    name: '',
    email: '',
    role: '',
    isSeed: false,
    password: ''
}


test.describe('User Profile', () => {
    test.describe.configure({ mode: "serial" });

    let userAPI: UserAPI;

    test.beforeEach(async ({ request }) => {
        userAPI = new UserAPI(request);
    });

    test('should fetch user profile successfully', async ({ request }) => {
        const stamp = Date.now();
        const registerResponse = await new AuthAPI(request).register(
            `New User ${stamp}`, `newuser${stamp}@demo.com`, 'newuser123',
        );
        expect(registerResponse.status()).toBe(201);
        const body = await registerResponse.json();
        USER_DETAILS = { ...USER_DETAILS, id: body.id, name: body.name, email: body.email, role: body.role, isSeed: body.isSeed, password: 'newuser123' }

        const response = await userAPI.me();
        expect(response.status()).toBe(200);
        const profile = await response.json();

        expect(profile).toHaveProperty('id');
        expect(profile).not.toHaveProperty('_id');
        expect(profile).not.toHaveProperty('password');

        expect(profile.id).toBe(USER_DETAILS.id);
        expect(profile.name).toBe(USER_DETAILS.name);
        expect(profile.email).toBe(USER_DETAILS.email);
        expect(profile.role).toBe(USER_DETAILS.role);
        expect(profile.isSeed).toBe(USER_DETAILS.isSeed);
    });

    test('checking', async ({ request }) => {
        const login = await new AuthAPI(request).login(USER_DETAILS.email, USER_DETAILS.password);
        expect(login.status()).toBe(200);

        const updateProfile = {
            name: `Updated ${USER_DETAILS.name}`,
            email: `updated${USER_DETAILS.email}`,
            password: 'updated123'
        }

        const response = await userAPI.updateProfile(updateProfile);
        expect(response.status()).toBe(200);
        const profile = await response.json();
        expect(profile.name).toBe(updateProfile.name);
        expect(profile.email).not.toBe(updateProfile.email); // email will not be updated
        expect(profile.email).toBe(USER_DETAILS.email);

        //login with old password
        const loginAgain = await new AuthAPI(request).login(USER_DETAILS.email, USER_DETAILS.password);
        expect(loginAgain.status()).toBe(401);

        // login with new password
        const loginNew = await new AuthAPI(request).login(USER_DETAILS.email, updateProfile.password);
        expect(loginNew.status()).toBe(200);
    })

    test('unauthenticated access on admin list all, stats and delete', async ({ request }) => {
        const listAll = await userAPI.listAll();
        expect(listAll.status()).toBe(401);

        const remove = await userAPI.remove(USER_DETAILS.id);
        expect(remove.status()).toBe(401);

        const stats = await userAPI.stats();
        expect(stats.status()).toBe(401);
    });

});

userContext.describe('Default User', () => {
    let userAPI: UserAPI;

    userContext.beforeEach(async ({ userRequest }) => {
        userAPI = new UserAPI(userRequest);
    });

    userContext('unauthenticated access on admin list all, stats and delete', async () => {
        const me = await userAPI.me();
        const user = await me.json();
        const id = user.id;

        const listAll = await userAPI.listAll();
        expect(listAll.status()).toBe(403);

        const remove = await userAPI.remove(id);
        expect(remove.status()).toBe(403);

        const stats = await userAPI.stats();
        expect(stats.status()).toBe(403);
    })
});

adminContext.describe('Admin User Management', () => {
    adminContext.describe.configure({ mode: "serial" });
    let userAPI: UserAPI;

    adminContext.beforeEach(async ({ adminRequest }) => {
        userAPI = new UserAPI(adminRequest);
    });

    adminContext('should list all users for admin', async () => {
        const response = await userAPI.listAll();
        expect(response.status()).toBe(200);

        const responseBody = await response.json();
        console.log(responseBody);
        expect(Array.isArray(responseBody)).toBe(true);
        expect(responseBody.length).toBeGreaterThan(0);
    });

    adminContext('should list the stats for admin', async () => {
        const response = await userAPI.stats();
        expect(response.status()).toBe(200);

        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('users');
        expect(responseBody).toHaveProperty('orders');
        expect(responseBody).toHaveProperty('products');
        expect(responseBody).toHaveProperty('revenue');
    });

    adminContext('should remove a user for admin', async ({ request }) => {
        const stamp = Date.now();
        const registerResponse = await new AuthAPI(request).register(
            `Admin Created User ${stamp}`, `newuser${stamp}@demo.com`, 'newuser123',
        );
        expect(registerResponse.status()).toBe(201);
        const body = await registerResponse.json();
        const user_id = body.id;

        const response = await userAPI.remove(user_id);
        expect(response.status()).toBe(200);

        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('id', user_id);
    });

    adminContext('should not remove the seeded user', async ( {userRequest} ) => {
        const userAccount = new UserAPI(userRequest);
        const userDetails = await userAccount.me();
        const userID = await userDetails.json();

        const remove = await userAPI.remove(userID.id);
        expect(remove.status()).toBe(403);
        
    })
});