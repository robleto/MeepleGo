import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import Hero from './Hero'

const meta: Meta<typeof Hero> = {
  title: 'Components/Hero',
  component: Hero,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Responsive marketing hero component supporting variants (default, awards) with title, subtitle, optional steps, and CTA. Used for landing sections and feature introductions.',
      },
    },
  },
  argTypes: {
    variant: { control: 'select', options: ['default', 'awards'] },
    title: { control: 'text' },
    subtitle: { control: 'text' },
    ctaText: { control: 'text' },
  },
}
export default meta

type Story = StoryObj<typeof Hero>

export const Awards: Story = {
  args: {
    variant: 'awards',
  },
}

export const Custom: Story = {
  args: {
    variant: 'default',
    title: 'Track. Rate. Discover.',
    subtitle:
      'Your modern board game companion—organize your collection, surface hidden gems, and celebrate favorites.',
    steps: [
      {
        heading: 'Build your collection',
        text: 'Import or search to add games with clean covers and metadata.',
      },
      {
        heading: 'Rate & log plays',
        text: 'Simple 1–10 ratings and quick “Played It” marking keep data frictionless.',
      },
      {
        heading: 'Unlock insights',
        text: 'Dynamic filters and personal awards reveal patterns in what you love.',
      },
    ],
    ctaText: 'Get Started',
  },
}

export const MultipleInstances: Story = {
  render: () => (
    <div className="space-y-24 p-8">
      <Hero variant="awards" />
      <Hero
        variant="default"
        title="Organize & Rank"
        subtitle="Bring structure to your hobby—curate lists, track favorites, and compare ratings."
        steps={[
          {
            heading: 'Create lists',
            text: 'Custom ranked or unranked lists keep themes together.',
          },
          {
            heading: 'Compare ratings',
            text: 'Spot rating bands and outliers at a glance.',
          },
          {
            heading: 'Share highlights',
            text: 'Showcase your personal awards and category standouts.',
          },
        ]}
      />
      <Hero
        variant="default"
        title="Data That Inspires"
        subtitle="Meaningful summaries without the spreadsheet overhead."
        steps={[
          {
            heading: 'Smart grouping',
            text: 'Sort & filter by year, mechanics, weight, and more.',
          },
          {
            heading: 'Trend awareness',
            text: 'See how your interests evolve over time.',
          },
          {
            heading: 'Refine choices',
            text: 'Use rankings & awards to guide what to play next.',
          },
        ]}
      />
    </div>
  ),
  parameters: {
    layout: 'fullscreen',
  },
}
