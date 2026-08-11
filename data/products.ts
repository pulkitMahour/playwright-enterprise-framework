import { ValidationCase } from './types';

export const PRODUCT_CREATE_CASES: ValidationCase[] = [
    { label: 'empty body', payload: {} },
    {
        label: 'missing countInStock',
        payload: { name: 'No Stock Field', price: 10, category: 'Electronics' },
    },
    {
        label: 'name shorter than 2 chars',
        payload: { name: 'A', price: 10, category: 'Electronics', countInStock: 1 },
    },
    {
        label: 'negative price',
        payload: { name: 'Negative Price', price: -1, category: 'Electronics', countInStock: 1 },
    },
    {
        label: 'negative countInStock',
        payload: { name: 'Negative Stock', price: 10, category: 'Electronics', countInStock: -1 },
    },
    {
        label: 'rating above the max of 5',
        payload: {
            name: 'Overrated',
            price: 10,
            category: 'Electronics',
            countInStock: 1,
            rating: 6,
        },
    },
    {
        label: 'price sent as a string',
        payload: { name: 'String Price', price: '10', category: 'Electronics', countInStock: 1 },
    },
];

export function validProduct() {
    return {
        name: `Test Product ${Date.now()}`,
        description: 'This is a test product',
        price: 99.99,
        category: 'Electronics',
        countInStock: 10,
    };
}
