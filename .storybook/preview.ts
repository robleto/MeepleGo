import type { Preview } from '@storybook/nextjs-vite'
import '../src/app/globals.css'

const preview: Preview = {
  parameters: {
    options: {
      storySort: {
        order: [
          'Foundations',
          'Design System',
          'Elements',
          'Components',
          'Global'
        ],
        method: 'alphabetical',
        includeNames: true,
      },
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
