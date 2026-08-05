import { APIResponse } from '@playwright/test';
import { BaseAPI } from './BaseAPI';

export class AuthAPI extends BaseAPI {
    async login(email: string, password: string): Promise<APIResponse> {
        return this.request.post(this.url('/auth/login'), {
            data: { email, password },
        });
    }

    async register(name: string, email: string, password: string): Promise<APIResponse> {
        return this.request.post(this.url('/auth/register'), {
            data: { name, email, password },
        });
    }

    async logout(): Promise<APIResponse> {
        return this.request.post(this.url('/auth/logout'));
    }

    async loginRaw(data: unknown): Promise<APIResponse> {
        return this.request.post(this.url('/auth/login'), { data });
    }

    async registerRaw(data: unknown): Promise<APIResponse> {
        return this.request.post(this.url('/auth/register'), { data });
    }
}
