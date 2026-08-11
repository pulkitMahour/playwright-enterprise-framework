import type { ShippingAddress } from '../api/OrderAPI';

export type AddressCase = {
    label: string;
    address: ShippingAddress;
};

const ASCII: AddressCase = {
    label: 'plain ASCII values',
    address: {
        fullName: 'John Doe',
        street: '123 Main St',
        city: 'Springfield',
        postalCode: '12345',
        country: 'USA',
    },
};

const PUNCTUATION: AddressCase = {
    label: 'apostrophes, periods and hyphens',
    address: {
        fullName: "Elizabeth 'Tester' O'Connor-Smith",
        street: '12345 N. Boulevard East, Apt 4B-102',
        city: 'Winston-Salem',
        postalCode: '55555-9999',
        country: 'United States',
    },
};

const ACCENTED: AddressCase = {
    label: 'accented Latin characters',
    address: {
        fullName: 'Zoë Müller',
        street: "3 Rue de l'Église",
        city: 'Reichstett',
        postalCode: '67116',
        country: 'France',
    },
};

const NON_LATIN: AddressCase = {
    label: 'non-Latin characters',
    address: {
        fullName: '田中 太郎',
        street: '2-1-1 丸の内',
        city: '東京',
        postalCode: '100-0005',
        country: '日本',
    },
};

const LONG_VALUES: AddressCase = {
    label: 'values far longer than a typical address',
    address: {
        fullName: 'A'.repeat(80),
        street: 'B'.repeat(120),
        city: 'C'.repeat(60),
        postalCode: '9'.repeat(20),
        country: 'D'.repeat(60),
    },
};

const SINGLE_CHARS: AddressCase = {
    label: 'single-character values',
    address: {
        fullName: 'A',
        street: 'B',
        city: 'C',
        postalCode: '1',
        country: 'D',
    },
};

export const ADDRESS_CASES: readonly AddressCase[] = [
    ASCII,
    PUNCTUATION,
    ACCENTED,
    NON_LATIN,
    LONG_VALUES,
    SINGLE_CHARS,
];

export const UI_ADDRESS_CASES: readonly AddressCase[] = [PUNCTUATION, ACCENTED, NON_LATIN];

export const DEFAULT_SHIPPING_ADDRESS: ShippingAddress = ASCII.address;
