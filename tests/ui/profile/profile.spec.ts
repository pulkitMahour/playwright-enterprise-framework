import { type Page } from '@playwright/test';
import { test, expect } from '../../../fixtures/base.fixture';
import { ProfilePage } from '../../../pages/ProfilePage';
import { test as newRegister } from '../../../fixtures/auth.fixture';
import { LoginPage } from '../../../pages/LoginPage';

const existing_profile = {
    fullName: 'John Doe',
    street: '42 Market St',
    city: 'Springfield',
    postalCode: '55555',
    country: 'USA',
    password: 'user123'
}

const updated_profile = {
    fullName: "Elizabeth 'Tester' O'Connor-Smith",
    street: "12345 N. Boulevard East, Apt 4B 102",
    city: "Reichstett",
    postalCode: "67116",
    country: "France",
    password: 'newuser123'
};

test.describe('Profile Page Existing User', { tag: ['@profile'] }, () => {
    let page: Page;
    let profilePage: ProfilePage;

    test.beforeAll(async ({ userContext }) => {
        page = await userContext.newPage();
        await page.goto('/');
        await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30_000 });
    })

    test.beforeEach(async () => {
        profilePage = new ProfilePage(page);
        await profilePage.nav_profile.click();
        await expect(page).toHaveURL('/profile')
    })

    test('Verify prefilled profile form', { tag: '@smoke' }, async () => {
        await expect(profilePage.profile_form).toBeVisible();
        await expect(profilePage.profile_email).toBeDisabled();
        await expect(profilePage.profile_name).toHaveValue(existing_profile.fullName);
        await expect(profilePage.profile_street).toHaveValue(existing_profile.street);
        await expect(profilePage.profile_city).toHaveValue(existing_profile.city);
        await expect(profilePage.profile_postalCode).toHaveValue(existing_profile.postalCode);
        await expect(profilePage.profile_country).toHaveValue(existing_profile.country);
    })
})

newRegister.describe('Profile Page New User', { tag: ['@sanity', '@profile'] }, () => {
    newRegister.describe.configure({ mode: 'serial' })
    let page: Page;
    let profilePage: ProfilePage;
    let email: string

    newRegister.beforeAll(async ({ freshUserContext }) => {
        page = await freshUserContext.newPage();
        await page.goto('/');
        await page.waitForURL((url) => !url.pathname.includes('/login'), { timeout: 30_000 });
    });

    newRegister.beforeEach(async () => {
        profilePage = new ProfilePage(page);
        await profilePage.nav_profile.click();
        await expect(page).toHaveURL('/profile')
        email = await profilePage.profile_email.inputValue();
    })

    newRegister('Update name and address', async () => {
        await expect(profilePage.profile_email).toBeDisabled();
        await profilePage.fillProfileForm(updated_profile);
        await profilePage.profile_save.click();
        await expect(profilePage.profile_save).toBeEnabled();
        await page.reload();
        await expect(profilePage.profile_name).toHaveValue(updated_profile.fullName);
        await expect(profilePage.profile_street).toHaveValue(updated_profile.street);
        await expect(profilePage.profile_city).toHaveValue(updated_profile.city);
        await expect(profilePage.profile_postalCode).toHaveValue(updated_profile.postalCode);
        await expect(profilePage.profile_country).toHaveValue(updated_profile.country);
    })

    newRegister('Invalid input', async () => {
        await profilePage.profile_name.fill('A');
        await profilePage.profile_save.click();
        await expect(profilePage.profile_error).toBeVisible();
        await expect(profilePage.profile_error).toHaveText('name must be longer than or equal to 2 characters')
        await page.reload();
        await expect(profilePage.profile_name).toHaveValue(updated_profile.fullName);
    })

    newRegister('Update Password and re-login with old password', async () => {
        await profilePage.profile_password.fill(updated_profile.password);
        await profilePage.profile_save.click();
        await expect(profilePage.profile_save).toBeEnabled();

        await page.goto('/');
        await profilePage.logoutButton.click();
        await expect(profilePage.loginStatusButton).toBeVisible();
        await profilePage.loginStatusButton.click();

        // login with old password. error should be thrown
        const login = new LoginPage(page);
        await login.login(email, existing_profile.password);
        await expect(login.loginError).toHaveText('Invalid email or password');
        await expect(page).toHaveURL('/login');

        //login with updated password. should be logged it.
        await login.login(email, updated_profile.password);
        await expect(login.navbar_name).toHaveText(updated_profile.fullName)
    })
})