import { APIResponse } from '@playwright/test';
import { BaseAPI, QueryParams } from './BaseAPI';

export type ProductQuery = {
    keyword?: string;
    category?: string;
    sort?: string;
    page?: number;
    /** Server clamps this to 1..50 and defaults to 12. */
    limit?: number;
};

export class ProductAPI extends BaseAPI {
    async list(query: ProductQuery = {}): Promise<APIResponse> {
        return this.request.get(this.url('/products'), {
            params: toParams(query),
        });
    }

    async getCategories(): Promise<APIResponse> {
        return this.request.get(this.url('/products/categories'));
    }

    async getById(id: string): Promise<APIResponse> {
        return this.request.get(this.url(`/products/${id}`));
    }

    // --- admin-only writes: they live under /api/admin/products, NOT /api/products ---

    async create(data: unknown): Promise<APIResponse> {
        return this.request.post(this.url('/admin/products'), { data });
    }

    async update(id: string, data: unknown): Promise<APIResponse> {
        return this.request.put(this.url(`/admin/products/${id}`), { data });
    }

    async remove(id: string): Promise<APIResponse> {
        return this.request.delete(this.url(`/admin/products/${id}`));
    }
}

/** Drops undefined keys so an unset filter is absent from the query string, not `?page=undefined`. */
function toParams(query: ProductQuery): QueryParams {
    return Object.fromEntries(
        Object.entries(query).filter(([, value]) => value !== undefined),
    ) as QueryParams;
}
