import { APIResponse } from '@playwright/test';
import { BaseAPI } from './BaseAPI';

export type OrderItemInput = {
    product: string; // the product's `_id`
    qty: number;
    price?: number;
    name?: string;
    image?: string;
};

export type ShippingAddress = {
    address?: string;
    city?: string;
    postalCode?: string;
    country?: string;
};

export type CreateOrderInput = {
    orderItems: OrderItemInput[];
    shippingAddress?: ShippingAddress;
    paymentMethod?: string;
};

export class OrderAPI extends BaseAPI {
    async create(order: CreateOrderInput): Promise<APIResponse> {
        return this.request.post(this.url('/orders'), { data: order });
    }

    async createRaw(data: unknown): Promise<APIResponse> {
        return this.request.post(this.url('/orders'), { data });
    }

    async getMine(): Promise<APIResponse> {
        return this.request.get(this.url('/orders/mine'));
    }

    async getById(id: string): Promise<APIResponse> {
        return this.request.get(this.url(`/orders/${id}`));
    }

    // --- admin-only: under /api/admin, not /api/orders ---

    async listAll(): Promise<APIResponse> {
        return this.request.get(this.url('/admin/orders'));
    }

    async updateStatus(id: string, data: unknown): Promise<APIResponse> {
        return this.request.put(this.url(`/admin/orders/${id}/status`), { data });
    }

    async remove(id: string): Promise<APIResponse> {
        return this.request.delete(this.url(`/admin/orders/${id}`));
    }
}
