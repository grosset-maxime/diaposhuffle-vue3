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
    'max-len': [ 'warn', { code: 100, ignoreUrls: true } ],
    'arrow-parens': [ 'error', 'always' ],
    semi: [ 'error', 'never' ],
    'prefer-template': 'error',
    'operator-linebreak': [ 'error', 'before' ],
    'no-warning-comments': 'warn',
    'no-console': [ 'warn', { allow: [ 'warn', 'error' ] } ],
    'no-debugger': 'warn',
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
