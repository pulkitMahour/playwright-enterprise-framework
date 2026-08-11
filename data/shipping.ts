export type ShippingCase = {
    label: string;
    price: number;
    expectedTax: number;
    expectedShipping: number;
    expectedTotal: number;
};

export const SHIPPING_CASES: readonly ShippingCase[] = [
    {
        label: 'a cent under the threshold',
        price: 99.99,
        expectedTax: 10,
        expectedShipping: 10,
        expectedTotal: 119.99,
    },
    {
        label: 'exactly at the threshold',
        price: 100,
        expectedTax: 10,
        expectedShipping: 10,
        expectedTotal: 120,
    },
    {
        label: 'a cent over the threshold',
        price: 100.01,
        expectedTax: 10,
        expectedShipping: 0,
        expectedTotal: 110.01,
    },
    {
        label: 'well over the threshold',
        price: 199.99,
        expectedTax: 20,
        expectedShipping: 0,
        expectedTotal: 219.99,
    },
];

export type SummaryCase = ShippingCase & { product: string };

export const CHECKOUT_SUMMARY_CASES: readonly SummaryCase[] = [
    {
        label: 'under the free-shipping threshold',
        product: 'Raptor Gaming Mouse',
        price: 44.99,
        expectedTax: 4.5,
        expectedShipping: 10,
        expectedTotal: 59.49,
    },
    {
        label: 'over the free-shipping threshold',
        product: 'Echo Studio Headphones',
        price: 199.99,
        expectedTax: 20,
        expectedShipping: 0,
        expectedTotal: 219.99,
    },
];

export const DEFAULT_CART_PRODUCT = 'Raptor Gaming Mouse';
