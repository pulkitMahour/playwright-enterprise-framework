import { APIResponse } from '@playwright/test';
import { BaseAPI } from './BaseAPI';

export type ProfileUpdateInput = {
    name?: string;
    email?: string;
    password?: string;
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

    // --- admin-only: under /api/admin, not /api/users ---
    // (authorization spec: as a plain user -> 403, unauthenticated -> 401)

    async listAll(): Promise<APIResponse> {
        return this.request.get(this.url('/admin/users'));
    }

    async remove(id: string): Promise<APIResponse> {
        return this.request.delete(this.url(`/admin/users/${id}`));
    }

    /** `GET /api/admin/stats` — the dashboard numbers. Admin-only. */
    async stats(): Promise<APIResponse> {
        return this.request.get(this.url('/admin/stats'));
    }
}
