import type { Meta, StoryObj } from '@storybook/react'
import AwardsPanelReadOnly from './AwardsPanelReadOnly'

const meta: Meta<typeof AwardsPanelReadOnly> = {
  title: 'Components/Awards/AwardsPanelReadOnly',
  component: AwardsPanelReadOnly,
  parameters: {
    layout: 'padded',
  },
}

export default meta
type Story = StoryObj<typeof AwardsPanelReadOnly>

const winner = {
  id: 'game-1',
  name: 'Skyward Realms',
  year_published: 2024,
  image_url: 'https://picsum.photos/seed/award-winner/400/500',
  thumbnail_url: 'https://picsum.photos/seed/award-winner-thumb/200/200',
}

const nominees = [
  {
    id: 'game-2',
    name: 'Verdant Harbor',
    year_published: 2024,
    thumbnail_url: 'https://picsum.photos/seed/award-1/200/200',
  },
  {
    id: 'game-3',
    name: 'Clockwork Fables',
    year_published: 2023,
    thumbnail_url: 'https://picsum.photos/seed/award-2/200/200',
  },
  {
    id: 'game-4',
    name: 'Starlit Bazaar',
    year_published: 2024,
    thumbnail_url: 'https://picsum.photos/seed/award-3/200/200',
  },
  {
    id: 'game-5',
    name: 'Foxfire Syndicate',
    year_published: 2023,
    thumbnail_url: 'https://picsum.photos/seed/award-4/200/200',
  },
]

const manyNominees = [
  ...nominees,
  {
    id: 'game-6',
    name: 'Ember Crown',
    year_published: 2024,
    thumbnail_url: 'https://picsum.photos/seed/award-5/200/200',
  },
  {
    id: 'game-7',
    name: 'Tidal Dominion',
    year_published: 2023,
    thumbnail_url: 'https://picsum.photos/seed/award-6/200/200',
  },
  {
    id: 'game-8',
    name: 'Ironwood Gambit',
    year_published: 2024,
    thumbnail_url: 'https://picsum.photos/seed/award-7/200/200',
  },
  {
    id: 'game-9',
    name: 'Dusk Protocol',
    year_published: 2023,
    thumbnail_url: 'https://picsum.photos/seed/award-8/200/200',
  },
  {
    id: 'game-10',
    name: 'Coral Uprising',
    year_published: 2024,
    thumbnail_url: 'https://picsum.photos/seed/award-9/200/200',
  },
  {
    id: 'game-11',
    name: 'Zenith Accord',
    year_published: 2024,
    thumbnail_url: 'https://picsum.photos/seed/award-10/200/200',
  },
]

/** Winner + 4 nominees — typical state */
export const Default: Story = {
  args: {
    title: 'Best Strategy',
    yearLabel: 2025,
    winner,
    nominees,
  },
}

/** Winner only — no nominees */
export const WinnerOnly: Story = {
  args: {
    title: 'Best Kids',
    yearLabel: 2025,
    winner,
    nominees: [],
  },
}

/** Maximum 10 nominees */
export const FullNominees: Story = {
  args: {
    title: 'Best Overall',
    yearLabel: 2025,
    winner,
    nominees: manyNominees,
  },
}

/** With header extra action slot */
export const WithEditButton: Story = {
  args: {
    title: 'Best Cooperative',
    yearLabel: 2025,
    winner,
    nominees: nominees.slice(0, 2),
    headerExtra: (
      <button className="text-[11px] inline-flex items-center gap-1 px-2 py-1 rounded border border-gray-200 bg-white hover:bg-gray-50 text-gray-600">
        Edit
      </button>
    ),
  },
}

/** Missing image on winner */
export const MissingWinnerImage: Story = {
  args: {
    title: 'Best Card Game',
    yearLabel: 2025,
    winner: { id: 'game-no-img', name: 'Mystery Card Game', year_published: 2024 },
    nominees: nominees.slice(0, 3),
  },
}
