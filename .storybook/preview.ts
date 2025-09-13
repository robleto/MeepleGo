import type { Preview } from '@storybook/nextjs-vite'
import '../src/app/globals.css'

const preview: Preview = {
  parameters: {
    options: {
      storySort: {
        order: [
          'Introduction',
          'Get Started',
          'Contributions',
          'Foundations',
          'Controls',
          'Components',
          'Elements',
          'Archived',
        ],
        method: 'alphabetical',
        includeNames: true,
      },
    },
    docs: {
      defaultName: 'Docs', // This makes Docs the default page
    },
    backgrounds: {
      default: 'site',
      values: [
        {
          name: 'site',
          value: '#E7F4FF',
        },
        {
          name: 'dark',
          value: '#0f172a',
        },
        {
          name: 'white',
          value: '#ffffff',
        },
        {
          name: 'gray',
          value: '#f8fafc',
        },
      ],
    },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: 'todo',
    },
  },
}

export default preview
