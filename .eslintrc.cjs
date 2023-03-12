/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution');

module.exports = {
  root: true,
  extends: [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    '@vue/eslint-config-typescript',
    '@vue/eslint-config-prettier',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules: {
    'max-len': ['warn', { code: 100, ignoreUrls: true }],
    'arrow-parens': ['error', 'always'],
    semi: ['error', 'always', { omitLastInOneLineBlock: true }],
    'prefer-template': 'error',
    // 'operator-linebreak': ['error', 'before'],
    'no-warning-comments': 'warn',
    'no-console': process.env.NODE_ENV === 'production' ? 'warn' : 'warn',
    'no-debugger': process.env.NODE_ENV === 'production' ? 'error' : 'warn',
  },
};
