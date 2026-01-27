import { defineConfig } from 'vitest/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dirname =
  typeof __dirname !== 'undefined'
    ? __dirname
    : path.dirname(fileURLToPath(import.meta.url))

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: [],
    projects: [
      // Unit tests project
      {
        test: {
          name: 'unit',
          include: [
            'src/**/__tests__/**/*.test.{ts,tsx}',
            'tests/**/*.test.{ts,tsx}',
          ],
          exclude: ['src/**/*.stories.{ts,tsx}'],
        },
      },
      // Note: Storybook browser tests disabled - see https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
    ],
  },
})
