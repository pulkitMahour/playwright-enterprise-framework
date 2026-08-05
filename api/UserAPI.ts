import { APIResponse } from '@playwright/test';
import { BaseAPI } from './BaseAPI';

export type AddressInput = {
    street?: string;
    city?: string;
    postalCode?: string;
    country?: string;
};
export type ProfileUpdateInput = {
    name?: string;
    password?: string;
    address?: AddressInput;
};

export class UserAPI extends BaseAPI {
    async me(): Promise<APIResponse> {
        return this.request.get(this.url('/users/me'));
    }

    async updateProfile(data: ProfileUpdateInput): Promise<APIResponse> {
        return this.request.put(this.url('/users/me'), { data });
    }

    async updateProfileRaw(data: unknown): Promise<APIResponse> {
        return this.request.put(this.url('/users/me'), { data });
    }

    async listAll(): Promise<APIResponse> {
        return this.request.get(this.url('/admin/users'));
    }

    async remove(id: string): Promise<APIResponse> {
        return this.request.delete(this.url(`/admin/users/${id}`));
    }

    async stats(): Promise<APIResponse> {
        return this.request.get(this.url('/admin/stats'));
    }
}
