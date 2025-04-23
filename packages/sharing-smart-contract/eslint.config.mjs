import eslint from '@eslint/js';
import importPlugin from 'eslint-plugin-import';
import prettier from 'eslint-config-prettier';

export default [
  eslint.configs.recommended,
  prettier,
  {
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    plugins: { import: importPlugin },
  },
  {
    files: ['scripts/**/*.js', 'test/**/*.js', 'hardhat.config.cjs'],
    rules: {
      'import/no-extraneous-dependencies': ['error', { devDependencies: true }],
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
  },];
