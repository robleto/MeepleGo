import type { Meta, StoryObj } from '@storybook/react'
import { IconCircle, ICON_CIRCLE_TONES, ICON_CIRCLE_SIZES } from './elements/IconCircle'
import { TrophyIcon, PlayIcon, HeartIcon, BookmarkIcon, StarIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline'

const meta: Meta<typeof IconCircle> = {
  title: 'Design System/Icons',
  component: IconCircle,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Icon system using Heroicons with optional IconCircle wrapper for consistent styling across MeepleGo.'
      }
    }
  },
  argTypes: {
    size: { control: 'select', options: ICON_CIRCLE_SIZES },
    tone: { control: 'select', options: ICON_CIRCLE_TONES },
    border: { control: 'boolean' }
  }
}
export default meta

type Story = StoryObj<typeof IconCircle>

// ========================================
// ICON CIRCLE COMPONENT DEMOS
// ========================================

export const Default: Story = {
  name: 'IconCircle Default',
  args: {
    size: 'md',
    tone: 'neutral',
    border: true,
    children: <TrophyIcon className="w-6 h-6" />
  }
}

export const AllSizes: Story = {
  name: 'IconCircle Sizes',
  render: () => (
    <div className="flex gap-6 items-end">
      {ICON_CIRCLE_SIZES.map(size => (
        <div key={size} className="text-center space-y-2">
          <IconCircle size={size}>
            <TrophyIcon className={size==='sm'?'w-5 h-5':size==='md'?'w-6 h-6':'w-8 h-8'} />
          </IconCircle>
          <div className="text-xs text-gray-500">{size}</div>
        </div>
      ))}
    </div>
  )
}

export const AllTones: Story = {
  name: 'IconCircle Tones',
  render: () => (
    <div className="flex gap-4 flex-wrap">
      {ICON_CIRCLE_TONES.map(tone => (
        <div key={tone} className="text-center space-y-1">
          <IconCircle tone={tone} size="md">
            <TrophyIcon className="w-6 h-6" />
          </IconCircle>
          <div className="text-xs text-gray-500">{tone}</div>
        </div>
      ))}
    </div>
  )
}

// ========================================
// ICON USAGE PATTERNS
// ========================================

export const RawIcons: Story = {
  name: 'Raw Heroicons',
  parameters: { 
    docs: { 
      description: { 
        story: 'Raw Heroicons for buttons, inline actions, and dense UI elements.' 
      } 
    } 
  },
  render: () => (
    <div className="space-y-6">
      <div>
        <h4 className="text-sm font-semibold mb-3">Common UI Icons</h4>
        <div className="flex gap-4 text-gray-600">
          <TrophyIcon className="w-6 h-6" />
          <PlayIcon className="w-6 h-6" />
          <HeartIcon className="w-6 h-6" />
          <BookmarkIcon className="w-6 h-6" />
          <StarIcon className="w-6 h-6" />
          <ClipboardDocumentCheckIcon className="w-6 h-6" />
        </div>
      </div>
      
      <div>
        <h4 className="text-sm font-semibold mb-3">Size Variations</h4>
        <div className="flex gap-4 items-end text-gray-600">
          <TrophyIcon className="w-4 h-4" />
          <TrophyIcon className="w-5 h-5" />
          <TrophyIcon className="w-6 h-6" />
          <TrophyIcon className="w-8 h-8" />
        </div>
      </div>
    </div>
  )
}

export const IconComparison: Story = {
  name: 'Usage Patterns',
  parameters: { 
    docs: { 
      description: { 
        story: 'When to use raw icons vs IconCircle wrapper.' 
      } 
    } 
  },
  render: () => (
    <div className="space-y-8">
      <div>
        <h4 className="text-sm font-semibold mb-4">Raw Icons - For UI Actions</h4>
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 border rounded">
            <button className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-100 rounded hover:bg-gray-200">
              <PlayIcon className="w-4 h-4" />
              Play Game
            </button>
            <button className="p-2 text-gray-500 hover:text-red-500">
              <HeartIcon className="w-5 h-5" />
            </button>
            <button className="p-2 text-gray-500 hover:text-amber-500">
              <BookmarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
      
      <div>
        <h4 className="text-sm font-semibold mb-4">IconCircle - For Badges & Features</h4>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <IconCircle size="sm" tone="amber">
                <TrophyIcon className="w-5 h-5" />
              </IconCircle>
              <span className="text-sm">Award Winner</span>
            </div>
            
            <div className="flex items-center gap-2">
              <IconCircle size="md" tone="primary">
                <StarIcon className="w-6 h-6" />
              </IconCircle>
              <span className="text-sm">Featured Game</span>
            </div>
            
            <div className="flex items-center gap-2">
              <IconCircle size="sm" tone="emerald">
                <ClipboardDocumentCheckIcon className="w-5 h-5" />
              </IconCircle>
              <span className="text-sm">Completed</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export const UsageGuidelines: Story = {
  name: 'Guidelines',
  parameters: {
    layout: 'fullscreen',
  },
  render: () => (
    <div className="prose prose-sm max-w-none p-6">
      <h1 className="mt-0">Icon System Guidelines</h1>
      
      <h2>Components</h2>
      
      <h3>Raw Heroicons</h3>
      <p>Use directly for:</p>
      <ul>
        <li>Button icons and UI actions</li>
        <li>Inline indicators and small glyphs</li>
        <li>Dense toolbars and navigation</li>
        <li>Size range: <code>w-4 h-4</code> to <code>w-8 h-8</code></li>
      </ul>

      <h3>IconCircle Wrapper</h3>
      <p>Use for:</p>
      <ul>
        <li>Award badges and achievement indicators</li>
        <li>Feature callouts and status indicators</li>
        <li>List/category avatar-style icons</li>
        <li>Dashboard stats and prominent elements</li>
      </ul>

      <h2>Properties</h2>
      
      <h3>Size</h3>
      <ul>
        <li><code>sm</code>: 40px (h-10 w-10) - Compact badges</li>
        <li><code>md</code>: 56px (h-14 w-14) - Standard features</li>
        <li><code>lg</code>: 64px (h-16 w-16) - Prominent elements</li>
      </ul>

      <h3>Tone</h3>
      <ul>
        <li><code>neutral</code>: Gray background - Default/neutral states</li>
        <li><code>primary</code>: Indigo background - Brand/primary actions</li>
        <li><code>amber</code>: Amber background - Awards/achievements</li>
        <li><code>pink</code>: Pink background - Special/premium features</li>
        <li><code>sky</code>: Sky background - Information/secondary</li>
        <li><code>emerald</code>: Emerald background - Success/completion</li>
      </ul>

      <h2>Best Practices</h2>
      <ul>
        <li>Provide <code>aria-label</code> for interactive icons</li>
        <li>Match icon size to container size in IconCircle</li>
        <li>Use semantic tone colors that match content meaning</li>
        <li>Avoid mixing raw icons and IconCircle in the same context</li>
        <li>Keep icon usage consistent across similar features</li>
      </ul>

      <h2>Code Examples</h2>
      
      <pre className="bg-gray-900 text-gray-100 p-4 rounded text-sm">
{`// Raw icon for button
<button className="flex items-center gap-2">
  <PlayIcon className="w-4 h-4" />
  Play Game
</button>

// IconCircle for badge
<IconCircle tone="amber" size="sm">
  <TrophyIcon className="w-5 h-5" />
</IconCircle>`}
      </pre>
    </div>
  )
}