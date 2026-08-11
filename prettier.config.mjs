export default {
    tabWidth: 4,
    singleQuote: true,
    semi: true,
    printWidth: 100,
    trailingComma: 'all',
    endOfLine: 'lf',
    overrides: [
        {
            files: ['*.yml', '*.yaml'],
            options: { tabWidth: 2 },
        },
    ],
};
