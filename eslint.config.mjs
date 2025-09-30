// Simplified ESLint config for ESLint v9+
// Temporarily simplify to avoid parser issues during CI

import js from '@eslint/js'
import parser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import nextPlugin from '@next/eslint-plugin-next'
import prettierPlugin from 'eslint-plugin-prettier'
import globals from 'globals'

export default [
  {
    ignores: [
      'node_modules/',
      '.next/',
      'out/',
      'build/',
      'data/raw/',
      'data/derived/',
    ],
  },
  // Base JS + globals
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser,
      parserOptions: {
        ecmaVersion: 2024,
        sourceType: 'module',
        ecmaFeatures: {
          jsx: true,
        },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
        React: 'readonly',
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      '@next/next': nextPlugin,
      prettier: prettierPlugin,
    },
    // Simplified rules to avoid parser errors
    rules: {
      // Basic rules
      'no-empty': 'error',
      'no-undef': 'error', 
      'prettier/prettier': 'error',
      
      // TypeScript rules (simplified)
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-redundant-type-constituents': 'error',
      '@typescript-eslint/require-await': 'error',
      
      // Next.js rules
      '@next/next/no-html-link-for-pages': 'error',
    },
  },
]
