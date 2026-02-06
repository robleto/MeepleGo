import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import CollectionStepper from './CollectionStepper'

const meta: Meta<typeof CollectionStepper> = {
  title: 'Components/CollectionStepper',
  component: CollectionStepper,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    nextjs: { appDirectory: true },
  },
}

export default meta
type Story = StoryObj<typeof CollectionStepper>

export const Default: Story = {
  args: {
    gameId: 'g-collection-1',
    gameName: 'Brass: Birmingham',
    membership: { library: false, wishlist: true },
    suggestedLists: ['Economic', 'Network Building', 'Industry'],
    onMembershipChange: () => {},
    onClose: () => {},
    onOpenCollections: () => {},
    onDismiss: () => {},
    playedIt: false,
    onTogglePlayed: () => {},
  },
}
