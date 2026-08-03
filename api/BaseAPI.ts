import { APIRequestContext, APIResponse } from '@playwright/test';

export class BaseAPI {
    protected readonly request: APIRequestContext;

    constructor(request: APIRequestContext) {
        this.request = request;
    }

    protected url(path: string): string {
        return `/api${path.startsWith('/') ? path : `/${path}`}`;
    }

    async get(path: string, params?: QueryParams): Promise<APIResponse> {
        return this.request.get(this.url(path), { params });
    }
}

export type QueryParams = Record<string, string | number | boolean>;
