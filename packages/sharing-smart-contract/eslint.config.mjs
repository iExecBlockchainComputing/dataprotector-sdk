import eslint from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import prettier from 'eslint-config-prettier';
import globals from 'globals';

export default [
    eslint.configs.recommended,
    prettier,
    {
        languageOptions: {
          ecmaVersion: 'latest',
          sourceType: 'module',
            globals: {
                ...globals.browser,
                ...globals.node,
                myCustomGlobal: 'readonly',
            },
        },
        plugins: { import: importPlugin },
        ignores: [
            '**/node_modules/',
            '**/coverage/',
            '**/build/',
            '**/typechain-types/',
            '**/tools/',
        ],
        rules: {
            'import/prefer-default-export': 'off',
            'import/extensions': ['error', 'always'],
        },
    },
    {
        files: ['scripts/**/*.js', 'test/**/*.js', 'hardhat.config.cjs'],
        rules: {
            'import/prefer-default-export': 'off',
            'import/extensions': ['error', 'always'],
        },
    },
    {
        files: ['test/**/*.js'],
        languageOptions: {
            globals: {
                describe: 'readonly',
                it: 'readonly',
            },
        },
        rules: {
            'no-unused-expressions': 'off',
            'no-shadow': 'off',
        },
    },
    {
        files: ['tools/**/*.js'],
        rules: {
            'no-undef': 'warn',
        },
    },
];
