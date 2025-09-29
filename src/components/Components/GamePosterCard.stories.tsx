import type { Meta } from '@storybook/nextjs-vite'

const meta: Meta = {
  title: 'Deprecated/GamePosterCard',
  parameters: {
    docs: {
      description: {
        component:
          'GamePosterCard deprecated in favor of GameCard. File kept temporarily as stub.',
      },
    },
  },
}
export default meta

export const Deprecated = {
  render: () => null,
}
