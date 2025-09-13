import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import Textarea from './Textarea'

const meta: Meta<typeof Textarea> = {
  title: 'Controls/Textarea',
  component: Textarea,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          'A flexible textarea component with support for different sizes, states, and auto-resize functionality for dynamic content.',
      },
    },
  },
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    state: {
      control: 'select',
      options: ['default', 'error', 'success'],
    },
    disabled: {
      control: 'boolean',
    },
    autoResize: {
      control: 'boolean',
    },
    rows: {
      control: 'number',
    },
    placeholder: {
      control: 'text',
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Textarea>

export const Default: Story = {
  args: {
    placeholder: 'Enter your text here...',
    rows: 3,
  },
}

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <div>
        <label className="block text-sm font-medium mb-1">Small</label>
        <Textarea size="sm" placeholder="Small textarea" rows={2} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">
          Medium (Default)
        </label>
        <Textarea size="md" placeholder="Medium textarea" rows={3} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Large</label>
        <Textarea size="lg" placeholder="Large textarea" rows={4} />
      </div>
    </div>
  ),
}

export const States: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <div>
        <label className="block text-sm font-medium mb-1">Default</label>
        <Textarea placeholder="Default state" rows={3} />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 text-red-700">
          Error
        </label>
        <Textarea
          state="error"
          placeholder="Error state"
          rows={3}
          defaultValue="This text contains errors and needs to be reviewed."
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 text-green-700">
          Success
        </label>
        <Textarea
          state="success"
          placeholder="Success state"
          rows={3}
          defaultValue="This text has been validated successfully!"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1 text-gray-400">
          Disabled
        </label>
        <Textarea
          disabled
          placeholder="Disabled textarea"
          rows={3}
          defaultValue="This content cannot be edited."
        />
      </div>
    </div>
  ),
}

export const AutoResize: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <div>
        <label className="block text-sm font-medium mb-1">
          Auto-resize (Default Max Height)
        </label>
        <Textarea
          autoResize
          placeholder="Start typing... This textarea will grow as you type!"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">
          Auto-resize (Custom Max Height: 100px)
        </label>
        <Textarea
          autoResize
          maxHeight={100}
          placeholder="This will only grow up to 100px"
        />
      </div>
    </div>
  ),
}

export const VariousRowSizes: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <div>
        <label className="block text-sm font-medium mb-1">2 Rows</label>
        <Textarea rows={2} placeholder="Short textarea" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">4 Rows</label>
        <Textarea rows={4} placeholder="Medium textarea" />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">6 Rows</label>
        <Textarea rows={6} placeholder="Tall textarea" />
      </div>
    </div>
  ),
}

export const GameReviewForm: Story = {
  name: 'Real-world Example: Game Review',
  render: () => (
    <div className="space-y-6 w-96">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Write a Game Review
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quick Thoughts
            </label>
            <Textarea
              size="sm"
              rows={2}
              placeholder="Brief impression of the game..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Detailed Review
            </label>
            <Textarea
              autoResize
              maxHeight={150}
              placeholder="Share your detailed thoughts about gameplay, components, theme, and overall experience..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Teaching Notes
            </label>
            <Textarea
              size="lg"
              rows={4}
              placeholder="How easy is it to teach? Any tips for new players?"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Personal Notes (Private)
            </label>
            <Textarea
              rows={3}
              placeholder="Private notes that only you can see..."
              defaultValue="Remember to check if expansion is worth it"
            />
          </div>
        </div>
      </div>
    </div>
  ),
}

export const CharacterLimits: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="block text-sm font-medium text-gray-700">
            Short Description
          </label>
          <span className="text-xs text-gray-500">0 / 100</span>
        </div>
        <Textarea maxLength={100} rows={2} placeholder="Keep it brief..." />
      </div>

      <div>
        <div className="flex justify-between items-center mb-1">
          <label className="block text-sm font-medium text-gray-700">
            Full Review
          </label>
          <span className="text-xs text-gray-500">0 / 500</span>
        </div>
        <Textarea
          maxLength={500}
          autoResize
          placeholder="Share your complete thoughts..."
        />
      </div>
    </div>
  ),
}
