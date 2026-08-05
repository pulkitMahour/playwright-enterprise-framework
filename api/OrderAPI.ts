import { APIResponse } from '@playwright/test';
import { BaseAPI } from './BaseAPI';

export type OrderItemInput = {
    product: string;
    qty: number;
    price?: number;
    name?: string;
};

export type ShippingAddress = {
    fullName: string;
    street: string;
    city: string;
    postalCode: string;
    country: string;
};

export type CreateOrderInput = {
    items: OrderItemInput[];
    shippingAddress: ShippingAddress;
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
