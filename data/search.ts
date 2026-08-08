export type SearchCase = {
    label: string;
    keyword: string;
    expectedNames: readonly string[];
};

export const SEARCH_CASES: readonly SearchCase[] = [
    {
        label: 'a word from one product name',
        keyword: 'laptop',
        expectedNames: ['Nomad Laptop Backpack'],
    },
    {
        label: 'a word shared by two product names',
        keyword: 'mouse',
        expectedNames: ['Raptor Gaming Mouse', 'Nebula RGB Mousepad'],
    },
    {
        label: 'mixed case',
        keyword: 'WiReLeSs',
        expectedNames: ['Pulse Wireless Charger'],
    },
];

export const EMPTY_SEARCH_CASES: readonly Omit<SearchCase, 'expectedNames'>[] = [
    { label: 'a category name that no product name contains', keyword: 'audio' },
    { label: 'a nonsense keyword', keyword: 'zzzznope' },
];
