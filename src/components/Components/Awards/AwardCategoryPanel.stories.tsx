import type { Meta, StoryObj } from '@storybook/react'
import AwardCategoryPanel from './AwardCategoryPanel'

const meta: Meta<typeof AwardCategoryPanel> = {
  title: 'Components/Awards/AwardCategoryPanel',
  component: AwardCategoryPanel,
  parameters: {
    layout: 'padded',
  },
}

export default meta
type Story = StoryObj<typeof AwardCategoryPanel>

const winner = {
  id: 'game-1',
  name: 'Skyward Realms',
  year_published: 2023,
  thumbnail_url: 'https://picsum.photos/seed/award-winner/200/200',
}

const nominees = [
  {
    id: 'game-2',
    name: 'Verdant Harbor',
    thumbnail_url: 'https://picsum.photos/seed/award-1/200/200',
  },
  {
    id: 'game-3',
    name: 'Clockwork Fables',
    thumbnail_url: 'https://picsum.photos/seed/award-2/200/200',
  },
  {
    id: 'game-4',
    name: 'Starlit Bazaar',
    thumbnail_url: 'https://picsum.photos/seed/award-3/200/200',
  },
  {
    id: 'game-5',
    name: 'Foxfire Syndicate',
    thumbnail_url: 'https://picsum.photos/seed/award-4/200/200',
  },
]

export const Default: Story = {
  args: {
    title: 'Best Strategy',
    yearLabel: 2025,
    description: 'Deep, thinky strategy choices across multiple paths to victory.',
    winner,
    nominees,
  },
}

export const NomineesOnly: Story = {
  args: {
    title: 'Nominees',
    yearLabel: 2025,
    nomineeOnly: true,
    nominees,
  },
}
