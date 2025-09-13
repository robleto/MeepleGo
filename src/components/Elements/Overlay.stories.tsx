import type { Meta, StoryObj } from '@storybook/nextjs-vite'
import { useState } from 'react'
import Overlay from './Overlay'

const meta: Meta<typeof Overlay> = {
  title: 'Elements/Overlay',
  component: Overlay,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'A flexible overlay component for modals, dropdowns, and background overlays. Supports different opacity levels, blur effects, and click-to-close functionality.',
      },
    },
  },
  argTypes: {
    visible: {
      control: 'boolean',
    },
    variant: {
      control: 'select',
      options: ['dark', 'light', 'blur', 'transparent'],
    },
    position: {
      control: 'select',
      options: ['fixed', 'absolute'],
    },
    clickToClose: {
      control: 'boolean',
    },
    center: {
      control: 'boolean',
    },
    zIndex: {
      control: 'number',
    },
  },
  tags: ['autodocs'],
}

export default meta
type Story = StoryObj<typeof Overlay>

export const Default: Story = {
  args: {
    children: (
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4">
        <h3 className="text-lg font-semibold mb-2">Default Overlay</h3>
        <p className="text-gray-600">
          This is a basic overlay with dark background.
        </p>
      </div>
    ),
  },
}

export const Variants: Story = {
  render: () => {
    const [activeOverlay, setActiveOverlay] = useState<string | null>(null)

    return (
      <div className="p-8 space-y-4">
        <h3 className="text-lg font-semibold">
          Click buttons to see different overlay variants:
        </h3>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setActiveOverlay('dark')}
            className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
          >
            Dark Overlay
          </button>
          <button
            onClick={() => setActiveOverlay('light')}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
          >
            Light Overlay
          </button>
          <button
            onClick={() => setActiveOverlay('blur')}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Blur Overlay
          </button>
          <button
            onClick={() => setActiveOverlay('transparent')}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
          >
            Transparent Overlay
          </button>
        </div>

        {/* Sample content behind overlays */}
        <div className="mt-8 p-6 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg">
          <h4 className="text-xl font-bold text-gray-800 mb-2">
            Sample Content
          </h4>
          <p className="text-gray-600">
            This content will be covered by the overlay. Notice how different
            variants affect visibility.
          </p>
          <div className="mt-4 grid grid-cols-3 gap-4">
            {Array.from({ length: 6 }, (_, i) => (
              <div
                key={i}
                className="h-20 bg-gradient-to-br from-pink-200 to-yellow-200 rounded"
              ></div>
            ))}
          </div>
        </div>

        {/* Dark Overlay */}
        <Overlay
          visible={activeOverlay === 'dark'}
          variant="dark"
          clickToClose
          onClose={() => setActiveOverlay(null)}
        >
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-2">Dark Overlay</h3>
            <p className="text-gray-600 mb-4">
              Classic dark semi-transparent background.
            </p>
            <button
              onClick={() => setActiveOverlay(null)}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Close
            </button>
          </div>
        </Overlay>

        {/* Light Overlay */}
        <Overlay
          visible={activeOverlay === 'light'}
          variant="light"
          clickToClose
          onClose={() => setActiveOverlay(null)}
        >
          <div className="bg-gray-800 text-white rounded-lg shadow-xl p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-2">Light Overlay</h3>
            <p className="text-gray-300 mb-4">
              Light semi-transparent background, great for dark content.
            </p>
            <button
              onClick={() => setActiveOverlay(null)}
              className="px-4 py-2 bg-white text-gray-800 rounded hover:bg-gray-100"
            >
              Close
            </button>
          </div>
        </Overlay>

        {/* Blur Overlay */}
        <Overlay
          visible={activeOverlay === 'blur'}
          variant="blur"
          clickToClose
          onClose={() => setActiveOverlay(null)}
        >
          <div className="bg-white/90 backdrop-blur-sm rounded-lg shadow-xl p-6 max-w-md mx-4 border">
            <h3 className="text-lg font-semibold mb-2">Blur Overlay</h3>
            <p className="text-gray-600 mb-4">
              Backdrop blur effect for modern glass-morphism look.
            </p>
            <button
              onClick={() => setActiveOverlay(null)}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Close
            </button>
          </div>
        </Overlay>

        {/* Transparent Overlay */}
        <Overlay
          visible={activeOverlay === 'transparent'}
          variant="transparent"
          clickToClose
          onClose={() => setActiveOverlay(null)}
        >
          <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md mx-4 border-2 border-purple-200">
            <h3 className="text-lg font-semibold mb-2">Transparent Overlay</h3>
            <p className="text-gray-600 mb-4">
              No background, just positioning. Content shows through.
            </p>
            <button
              onClick={() => setActiveOverlay(null)}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Close
            </button>
          </div>
        </Overlay>
      </div>
    )
  },
}

export const ClickToClose: Story = {
  render: () => {
    const [visible, setVisible] = useState(false)

    return (
      <div className="p-8">
        <button
          onClick={() => setVisible(true)}
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Open Click-to-Close Overlay
        </button>

        <Overlay
          visible={visible}
          variant="blur"
          clickToClose
          onClose={() => setVisible(false)}
        >
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-2">
              Click Outside to Close
            </h3>
            <p className="text-gray-600 mb-4">
              This overlay can be closed by clicking outside the content area or
              using the button below.
            </p>
            <button
              onClick={() => setVisible(false)}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Close with Button
            </button>
          </div>
        </Overlay>
      </div>
    )
  },
}

export const GameModalExample: Story = {
  name: 'Real-world Example: Game Details Modal',
  render: () => {
    const [visible, setVisible] = useState(false)

    return (
      <div className="p-8">
        {/* Sample game card */}
        <div className="max-w-sm bg-white rounded-lg shadow-md overflow-hidden">
          <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-600"></div>
          <div className="p-4">
            <h3 className="font-bold text-lg">Wingspan</h3>
            <p className="text-gray-600 text-sm mb-3">
              A competitive bird-collection, engine-building game
            </p>
            <button
              onClick={() => setVisible(true)}
              className="w-full px-4 py-2 bg-sky-600 text-white rounded hover:bg-sky-700"
            >
              View Details
            </button>
          </div>
        </div>

        <Overlay
          visible={visible}
          variant="blur"
          clickToClose
          onClose={() => setVisible(false)}
          zIndex={100}
        >
          <div className="bg-white rounded-lg shadow-xl max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b">
              <h2 className="text-2xl font-bold">Wingspan</h2>
              <button
                onClick={() => setVisible(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6">
              <div className="flex gap-6">
                <div className="w-32 h-32 bg-gradient-to-br from-blue-400 to-purple-600 rounded-lg flex-shrink-0"></div>
                <div>
                  <p className="text-gray-600 mb-4">
                    You are bird enthusiasts—researchers, bird watchers,
                    ornithologists, and collectors—seeking to discover and
                    attract the best birds to your network of wildlife
                    preserves.
                  </p>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>Players:</strong> 1-5
                    </div>
                    <div>
                      <strong>Age:</strong> 10+
                    </div>
                    <div>
                      <strong>Play Time:</strong> 40-70 minutes
                    </div>
                    <div>
                      <strong>Designer:</strong> Elizabeth Hargrave
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex gap-3 p-6 border-t">
              <button className="flex-1 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                Add to Collection
              </button>
              <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                Add to Wishlist
              </button>
            </div>
          </div>
        </Overlay>
      </div>
    )
  },
}

export const PositionVariants: Story = {
  render: () => (
    <div className="relative h-96 bg-gray-100 p-8 overflow-hidden">
      <h3 className="text-lg font-semibold mb-4">Position Variants</h3>
      <p className="text-gray-600 mb-4">
        This container shows absolute positioning vs fixed.
      </p>

      <div className="relative h-48 bg-white rounded-lg border-2 border-dashed border-gray-300 p-4">
        <p className="text-sm text-gray-500">
          Relative container for absolute overlay
        </p>

        <Overlay
          position="absolute"
          variant="dark"
          center={false}
          className="flex items-end justify-center p-4"
        >
          <div className="bg-white rounded px-3 py-1 text-sm font-medium">
            Absolute Overlay
          </div>
        </Overlay>
      </div>
    </div>
  ),
}
