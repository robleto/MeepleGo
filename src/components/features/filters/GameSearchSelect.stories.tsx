import type { Meta, StoryObj } from '@storybook/react'
import GameSearchSelect from './GameSearchSelect'

const meta: Meta<typeof GameSearchSelect> = {
  title: 'Components/Filters/GameSearchSelect',
  component: GameSearchSelect,
  parameters: { layout: 'padded' }
}
export default meta

type Story = StoryObj<typeof GameSearchSelect>

const mockData = [
  { id: 1, name: 'Wingspan', year_published: 2019, rating: 8.1 },
  { id: 2, name: 'Wings of Glory', year_published: 2015, rating: 7.2 },
  { id: 3, name: 'Ark Nova', year_published: 2021, rating: 8.6 },
  { id: 4, name: 'Gloomhaven', year_published: 2017, rating: 8.7 },
  { id: 5, name: 'Azul', year_published: 2017, rating: 7.8 },
]

export const Default: Story = {
  render: () => (
    <div className="max-w-md">
      <GameSearchSelect fetchSuggestions={async (q)=> mockData.filter(g=> g.name.toLowerCase().includes(q))} />
    </div>
  )
}
