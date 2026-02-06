import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import PlayStepper from './PlayStepper'

const meta: Meta<typeof PlayStepper> = {
  title: 'Components/PlayStepper',
  component: PlayStepper,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    nextjs: { appDirectory: true },
  },
}

export default meta
type Story = StoryObj<typeof PlayStepper>

export const Default: Story = {
  args: {
    gameId: 'g-play-1',
    gameName: 'Terraforming Mars',
    gameImage:
      'https://cf.geekdo-images.com/wg9oOLcsKvDesSUdZQ4rxw__itemrep@2x/img/EvKLEl6QooFdwX2-wdWb2U0uX_E=/fit-in/492x600/filters:strip_icc()/pic3536616.jpg',
    playedIt: true,
    owned: true,
    currentRating: 8,
    onTogglePlayed: async () => {},
    onToggleOwned: async () => {},
    onRate: async () => {},
    onClearRating: async () => {},
    onClose: () => {},
    initialStep: 'status',
  },
}
