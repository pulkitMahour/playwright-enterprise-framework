import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class ProfilePage extends BasePage {
    readonly profile_form: Locator;
    readonly profile_name: Locator;
    readonly profile_email: Locator;
    readonly profile_password: Locator;
    readonly profile_street: Locator;
    readonly profile_city: Locator;
    readonly profile_postalCode: Locator;
    readonly profile_country: Locator;
    readonly profile_save: Locator;
    readonly profile_error: Locator;

    constructor(page: Page) {
        super(page);
        this.profile_form = page.getByTestId('profile-form');
        this.profile_name = page.getByTestId('profile-name');
        this.profile_email = page.getByTestId('profile-email');
        this.profile_password = page.getByTestId('profile-password');
        this.profile_street = page.getByTestId('profile-street');
        this.profile_city = page.getByTestId('profile-city');
        this.profile_postalCode = page.getByTestId('profile-postalCode');
        this.profile_country = page.getByTestId('profile-country');
        this.profile_save = page.getByTestId('profile-save');
        this.profile_error = page.getByTestId('profile-error');
    }

    async fillProfileForm(address: {
        fullName: string;
        street: string;
        city: string;
        postalCode: string;
        country: string;
    }) {
        await this.profile_name.fill(address.fullName);
        await this.profile_street.fill(address.street);
        await this.profile_city.fill(address.city);
        await this.profile_postalCode.fill(address.postalCode);
        await this.profile_country.fill(address.country);
    }
}
