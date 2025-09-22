import type { StorybookConfig } from '@storybook/nextjs-vite'
import path from 'path'

const config: StorybookConfig = {
  stories: [
    // Active story locations only. Legacy design-system & feature/shared placeholders archived.
    '../src/components/Components/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../src/components/Elements/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../src/components/Foundations/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    // Optional: keep design-system glob commented if directory removed.
    // "../src/design-system/**/*.stories.@(js|jsx|mjs|ts|tsx)",
    '../src/stories/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: [
    '@chromatic-com/storybook',
    '@storybook/addon-docs',
    '@storybook/addon-onboarding',
    '@storybook/addon-a11y',
    '@storybook/addon-vitest',
    '@storybook/addon-styling-webpack',
  ],
  framework: {
    name: '@storybook/nextjs-vite',
    options: {},
  },
  staticDirs: ['../public'],
  // Ensure Storybook's Vite builder resolves the '@' alias like Next.js and Vitest
  viteFinal: async (config) => {
    config.resolve = config.resolve || {}
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': path.resolve(__dirname, '../src'),
    }
    return config
  },
}
export default config
