import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'Components/GameCard/Overview',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: { 
      description: { 
        component: 'Overview of GameCard component variants and usage patterns.' 
      }
    }
  }
};

export default meta;
type Story = StoryObj;

export const Documentation: Story = {
  name: 'Documentation',
  render: () => (
    <div className="prose prose-sm max-w-none p-6">
      <h1 className="mt-0">GameCard Component</h1>
      
      <p>
        The GameCard component displays board games in either <strong>Grid</strong> or <strong>List</strong> view 
        with three density variants: <code>detailed</code>, <code>balanced</code>, and <code>compact</code>.
      </p>

      <h2>Key Props</h2>
      <ul>
        <li><code>viewMode</code>: 'grid' | 'list'</li>
        <li><code>variant</code>: 'detailed' | 'balanced' | 'compact'</li>
        <li><code>showSummary</code>, <code>showMeta</code>, <code>emphasizeMeta</code></li>
        <li><code>allowWinnerBadgeInListView</code>, <code>hideWinnerBadge</code></li>
        <li><code>listRank</code>: number for ordered lists</li>
      </ul>

      <h2>Related Stories</h2>
      <p>Explore the component variations:</p>
      <ul>
        <li><strong>Grid View</strong>: Layout + density variants + states showcase</li>
        <li><strong>List View</strong>: Standardized right‑side action group</li>
      </ul>

      <h2>Features</h2>
      
      <h3>Rating & State</h3>
      <p>
        Ratings use centralized color tokens. List view displays a subtle <code>RatingChip</code>; 
        grid view shows a hover rating square with popup for changes.
      </p>

      <h3>Lists & Membership</h3>
      <p>
        Hover bookmark button (grid) opens quick list picker. In list view, membership toggles are inline.
      </p>

      <h3>Awards</h3>
      <p>
        Winner badge suppressed in grid (handled externally); optionally shown in list view.
      </p>

      <h2>Usage Example</h2>
      <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm overflow-auto">
{`<GameCard
  game={game}
  viewMode="grid"
  variant="balanced"
  showMeta
  onMembershipChange={(id, change) => {
    // Handle membership changes
  }}
/>`}
      </pre>
    </div>
  )
}
