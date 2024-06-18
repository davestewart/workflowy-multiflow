// @see https://github.com/standard/eslint-config-standard/issues/411
import { readFileSync } from 'fs'
import { FlatCompat } from '@eslint/eslintrc'
import pluginVue from 'eslint-plugin-vue'

const compat = new FlatCompat()
const globals = JSON.parse(readFileSync('./.wxt/eslintrc-auto-import.json', 'utf-8'))

export default [
  // extends
  ...compat.extends('eslint-config-standard'),
  ...pluginVue.configs['flat/recommended'],

  /**
   * Ignores has to go in its own block
   * @see https://github.com/eslint/eslint/discussions/18304#discussioncomment-9069706
   */
  {
    ignores: [
      'dist/**/*',
      '.wxt/**/*'
    ]
  },

  /**
   * Project config
   */
  {
    env: {
      webextensions: true
    },

    // ignore auto-import globals
    languageOptions: {
      globals: {
        chrome: true,
        browser: true,
        ...globals,
      },
    },

    // process these files
    files: [
      'src/**/*.{ts,vue}'
    ],

    // additional rules
    rules: {
      // javascript
      'brace-style': ['error', 'stroustrup'],

      // vue
      'vue/require-default-prop': 0,
      'vue/max-attributes-per-line': ['error', {
        singleline: { max: 4 },
        multiline: { max: 1 }
      }]
    }
  }
]
