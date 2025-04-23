import eslint from '@eslint/js';
import tsEslint from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import importPlugin from 'eslint-plugin-import';

export default [
    {
        ...eslint.configs.recommended,
        ignores: [
            './tools/**',
            '**/node_modules/',
            '**/coverage/',
            '**/build/',
            '**/typechain-types/',
        ],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                ecmaVersion: 'latest',
                sourceType: 'module',
            },
        },
        plugins: {
            '@typescript-eslint': tsEslint,
            import: importPlugin,
        },
    },
];
