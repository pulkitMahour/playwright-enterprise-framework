import { test, expect, APIRequestContext } from '@playwright/test';
import { test as adminContext, test as userContext } from '../../fixtures/api.fixture';
import { UserAPI } from '../../api/UserAPI';
import { AuthAPI } from '../../api/AuthAPI';
import { INVALID_PROFILE_UPDATES } from '../../data/users';

type FreshUser = {
    id: string;
    name: string;
    email: string;
    role: string;
    isSeed: boolean;
    password: string;
};

async function registerFreshUser(context: APIRequestContext): Promise<FreshUser> {
    const stamp = `${Date.now()}-${test.info().workerIndex}`;
    const password = 'newuser123';

    const response = await new AuthAPI(context).register(
        `New User ${stamp}`, `newuser${stamp}@demo.com`, password,
    );
    expect(response.status()).toBe(201);

    return { ...(await response.json()), password };
}

test.describe('User Profile', { tag: ['@api', '@profile'] }, () => {
    let userAPI: UserAPI;

    test.beforeEach(async ({ request }) => {
        userAPI = new UserAPI(request);
    });

    test('should fetch user profile successfully', { tag: '@sanity' }, async ({ request }) => {
        const user = await registerFreshUser(request);

        const response = await userAPI.me();
        expect(response.status()).toBe(200);
        const profile = await response.json();

        expect(profile).toHaveProperty('id');
        expect(profile).not.toHaveProperty('_id');
        expect(profile).not.toHaveProperty('password');

        expect(profile.id).toBe(user.id);
        expect(profile.name).toBe(user.name);
        expect(profile.email).toBe(user.email);
        expect(profile.role).toBe(user.role);
        expect(profile.isSeed).toBe(false);
    });

    test('should update user profile successfully', { tag: '@sanity' }, async ({ request }) => {
        const user = await registerFreshUser(request);

        const updateProfile = {
            name: `Updated ${user.name}`,
            email: `updated${user.email}`,
            password: 'updated123'
        }

        const response = await userAPI.updateProfileRaw(updateProfile);
        expect(response.status()).toBe(200);
        const profile = await response.json();
        expect(profile.name).toBe(updateProfile.name);
        expect(profile.email).not.toBe(updateProfile.email); // email will not be updated
        expect(profile.email).toBe(user.email);

        const authAPI = new AuthAPI(request);

        //login with old password
        const loginAgain = await authAPI.login(user.email, user.password);
        expect(loginAgain.status()).toBe(401);

        // login with new password
        const loginNew = await authAPI.login(user.email, updateProfile.password);
        expect(loginNew.status()).toBe(200);
    })

    test('should merge address fields instead of replacing the block', async ({ request }) => {
        const user = await registerFreshUser(request);

        const first = await userAPI.updateProfile({
            address: { city: 'Springfield', country: 'USA' },
        });
        expect(first.status()).toBe(200);
        expect((await first.json()).address).toMatchObject({
            city: 'Springfield',
            country: 'USA',
        });

        const second = await userAPI.updateProfile({ address: { city: 'Shelbyville' } });
        expect(second.status()).toBe(200);
        const profile = await second.json();
        expect(profile.address.city).toBe('Shelbyville');
        expect(profile.address.country).toBe('USA');

        expect(profile.name).toBe(user.name);
        expect(profile.email).toBe(user.email);
    });

    test('unauthenticated access to admin list, stats and delete should be 401', async () => {
        // The id is never reached — the auth guard rejects before the handler looks it up — so this test needs no real user to exist.
        const someUserId = '6'.repeat(24);

        const listAll = await userAPI.listAll();
        expect(listAll.status()).toBe(401);

        const remove = await userAPI.remove(someUserId);
        expect(remove.status()).toBe(401);

        const stats = await userAPI.stats();
        expect(stats.status()).toBe(401);
    });

});

userContext.describe('Profile Update Validation', { tag: ['@api', '@profile'] }, () => {
    let userAPI: UserAPI;

    userContext.beforeEach(async ({ userRequest }) => {
        userAPI = new UserAPI(userRequest);
    });

    for (const { label, payload } of INVALID_PROFILE_UPDATES) {
        userContext(`profile update should reject ${label}`, async () => {
            const response = await userAPI.updateProfileRaw(payload);
            expect(response.status()).toBe(400);
        });
    }

    userContext('profile update should accept an empty body as a no-op', async () => {
        const before = await userAPI.me();
        const beforeProfile = await before.json();

        const response = await userAPI.updateProfile({});
        expect(response.status()).toBe(200);

        const profile = await response.json();
        expect(profile.name).toBe(beforeProfile.name);
        expect(profile.email).toBe(beforeProfile.email);
    });

    userContext('profile update should accept the shortest allowed values', async ({ request }) => {
        const user = await registerFreshUser(request);
        const freshUserAPI = new UserAPI(request);

        const response = await freshUserAPI.updateProfile({ name: 'Jo', password: '123456' });
        expect(response.status()).toBe(200);
        expect((await response.json()).name).toBe('Jo');

        const login = await new AuthAPI(request).login(user.email, '123456');
        expect(login.status()).toBe(200);
    });
});

userContext.describe('Default User', { tag: ['@api', '@profile'] }, () => {
    let userAPI: UserAPI;

    userContext.beforeEach(async ({ userRequest }) => {
        userAPI = new UserAPI(userRequest);
    });

    userContext('non-admin access to admin list, stats and delete should be 403', async () => {
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

adminContext.describe('Admin User Management', { tag: ['@api', '@profile', '@admin'] }, () => {
    adminContext.describe.configure({ mode: "serial" });
    let userAPI: UserAPI;

    adminContext.beforeEach(async ({ adminRequest }) => {
        userAPI = new UserAPI(adminRequest);
    });

    adminContext('should list all users for admin', { tag: '@sanity' }, async () => {
        const response = await userAPI.listAll();
        expect(response.status()).toBe(200);

        const responseBody = await response.json();
        expect(Array.isArray(responseBody)).toBe(true);
        expect(responseBody.length).toBeGreaterThan(0);
    });

    adminContext('should list the stats for admin', { tag: '@sanity' }, async () => {
        const response = await userAPI.stats();
        expect(response.status()).toBe(200);

        const responseBody = await response.json();
        expect(responseBody).toHaveProperty('users');
        expect(responseBody).toHaveProperty('orders');
        expect(responseBody).toHaveProperty('products');
        expect(responseBody).toHaveProperty('revenue');
    });

    adminContext('should remove a user for admin', { tag: '@sanity' }, async ({ request }) => {
        const { id: user_id } = await registerFreshUser(request);

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

    adminContext('admin should not be able to delete their own account', async ({ adminRequest }) => {
        const ownProfile = await new UserAPI(adminRequest).me();
        const { id } = await ownProfile.json();

        const response = await userAPI.remove(id);
        expect(response.status()).toBe(400);
        expect((await response.json()).message).toContain('You cannot delete your own account');

        const stillThere = await new UserAPI(adminRequest).me();
        expect(stillThere.status()).toBe(200);
    });
});