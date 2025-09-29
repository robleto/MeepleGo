// Flat ESLint config for ESLint v9+
// Migrated from legacy .eslintrc.json

import js from '@eslint/js'
import parser from '@typescript-eslint/parser'
import tsPlugin from '@typescript-eslint/eslint-plugin'
import nextPlugin from '@next/eslint-plugin-next'
import storybook from 'eslint-plugin-storybook'
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
  // Non-type-checked utility & config files (avoid parserOptions.project errors)
  {
    files: [
      'tailwind.config.js',
      'vitest.config.ts',
      'supabase/functions/**/*.ts',
    ],
    languageOptions: {
      parserOptions: { project: null },
    },
    rules: {
      '@typescript-eslint/no-var-requires': 'off',
      '@typescript-eslint/no-require-imports': 'off',
    },
  },
  // Base JS + globals
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      parser,
      parserOptions: {
        project: ['./tsconfig.json'],
        sourceType: 'module',
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      prettier: prettierPlugin,
      storybook,
      '@next/next': nextPlugin,
    },
    // Merge recommended configs
    rules: {
      ...js.configs.recommended.rules,
      ...tsPlugin.configs.recommended.rules,
      ...tsPlugin.configs['recommended-type-checked'].rules,
      ...nextPlugin.configs['core-web-vitals'].rules,
      ...storybook.configs.recommended.rules,
      // Project customizations
      'prettier/prettier': 'error',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unsafe-assignment': 'warn',
      '@typescript-eslint/no-unsafe-return': 'warn',
      '@typescript-eslint/no-unsafe-member-access': 'warn',
      '@typescript-eslint/no-unsafe-call': 'warn',
      '@typescript-eslint/no-unsafe-argument': 'warn',
      '@typescript-eslint/no-unnecessary-type-assertion': 'warn',
      '@typescript-eslint/no-floating-promises': [
        'warn',
        { ignoreVoid: true, ignoreIIFE: true },
      ],
      '@typescript-eslint/no-misused-promises': 'warn',
      'prefer-const': 'warn',
      '@next/next/no-img-element': 'warn',
    },
  },
  // Type-aware overrides (if needed for test files without project references)
  {
    files: ['**/*.test.{ts,tsx}', 'tests/**/*.ts'],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.json'],
        sourceType: 'module',
      },
    },
    rules: {
      // Allow dev flexibility in tests
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',
    },
  },
]
