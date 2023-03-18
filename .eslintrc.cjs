/* eslint-env node */
require('@rushstack/eslint-patch/modern-module-resolution')

module.exports = {
  root: true,
  extends: [
    'plugin:vue/vue3-essential',
    'eslint:recommended',
    '@vue/eslint-config-typescript',
  ],
  parserOptions: {
    ecmaVersion: 'latest',
  },
  rules: {
    'max-len': [ 'error', { code: 100, ignoreUrls: true } ],
    'arrow-parens': [ 'error', 'always' ],
    semi: [ 'error', 'never' ],
    'prefer-template': 'error',
    'operator-linebreak': [ 'error', 'before' ],
    'no-warning-comments': 'warn',
    'no-console': process.env.NODE_ENV === 'production'
      ? 'warn'
      : 'warn',
    'no-debugger': process.env.NODE_ENV === 'production'
      ? 'error'
      : 'warn',
    'comma-dangle': [ 'error', 'always-multiline' ],
    'space-before-function-paren': [ 'error', 'always' ],
    'no-underscore-dangle': [ 'off' ],
    quotes: [ 'error', 'single' ],
    indent: [ 'error', 2 ],
    'multiline-ternary': [ 'error', 'always' ],
    'space-infix-ops': 'error',
    'object-curly-spacing': [ 'error', 'always' ],
    'array-bracket-spacing': [ 'error', 'always' ],
    'computed-property-spacing': [ 'error', 'always' ],
    'arrow-spacing': 'error',
    'key-spacing': 'error',
  },
}
