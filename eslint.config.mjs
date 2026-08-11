import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import playwright from 'eslint-plugin-playwright';
import prettier from 'eslint-config-prettier/flat';

export default tseslint.config(
    {
        ignores: [
            'allure-results/',
            'allure-report/',
            'playwright-report/',
            'blob-report/',
            'test-results/',
            'plan/',
        ],
    },

    {
        files: ['**/*.ts'],
        extends: [js.configs.recommended, ...tseslint.configs.recommendedTypeChecked],
        languageOptions: {
            parserOptions: {
                projectService: true,
                tsconfigRootDir: import.meta.dirname,
            },
        },
        rules: {
            '@typescript-eslint/no-floating-promises': 'error',
            '@typescript-eslint/await-thenable': 'error',
            '@typescript-eslint/no-misused-promises': 'error',

            // Typed response models are issue #14 (API contract / schema validation); when that
            // lands, delete this block and the rules start paying for themselves.
            '@typescript-eslint/no-unsafe-member-access': 'off',
            '@typescript-eslint/no-unsafe-assignment': 'off',
            '@typescript-eslint/no-unsafe-argument': 'off',
            '@typescript-eslint/no-unsafe-call': 'off',
            '@typescript-eslint/no-unsafe-return': 'off',
        },
    },

    {
        files: ['tests/**/*.ts', 'fixtures/**/*.ts'],
        extends: [playwright.configs['flat/recommended']],
        settings: {
            playwright: {
                globalAliases: { test: ['customLogin', 'customRegister'] },
            },
        },
        rules: {
            'playwright/no-focused-test': 'error',
            'playwright/no-skipped-test': ['error', { allowConditional: true }],
            'playwright/no-wait-for-timeout': 'error',
            'playwright/no-networkidle': 'error',
            'playwright/no-element-handle': 'error',
            'playwright/no-page-pause': 'error',
            'playwright/no-force-option': 'error',
            'playwright/expect-expect': 'error',
            'playwright/prefer-web-first-assertions': 'error',
            'playwright/missing-playwright-await': 'error',

            'playwright/no-conditional-in-test': 'off',
            'playwright/prefer-locator': 'off',
        },
    },

    prettier,
);
