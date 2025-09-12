import React, { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react'
import { GameImage } from './GameImage'

const meta: Meta<typeof GameImage> = {
  title: 'Elements/GameImage',
  component: GameImage,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['square', 'thumb'],
    },
    src: {
      control: 'text',
    },
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const WithValidImage: Story = {
  args: {
    src: 'https://cf.geekdo-images.com/yLZJCVLlIx4c7eJEWUNJ7w__itemrep/img/Vxxy__bDYKWQMTOHAE9rJUdxM9o=/fit-in/246x300/filters:strip_icc()/pic4458123.jpg',
    alt: 'Wingspan board game',
    name: 'Wingspan',
    variant: 'square',
    className: 'w-48 h-48',
  },
}

export const WithBrokenImage: Story = {
  args: {
    src: 'https://invalid-url-that-will-fail.jpg',
    alt: 'Azul board game',
    name: 'Azul',
    variant: 'square',
    className: 'w-48 h-48',
  },
}

export const WithoutImage: Story = {
  args: {
    src: null,
    alt: 'Catan board game',
    name: 'Catan',
    variant: 'square',
    className: 'w-48 h-48',
  },
}

export const ThumbVariant: Story = {
  args: {
    src: 'https://cf.geekdo-images.com/yLZJCVLlIx4c7eJEWUNJ7w__thumb/img/ZPTOLpQKdTbPmtF3VGXz5VnGLxs=/fit-in/200x150/filters:strip_icc()/pic4458123.jpg',
    alt: 'Wingspan thumbnail',
    name: 'Wingspan',
    variant: 'thumb',
  },
}

export const ImageStates: Story = {
  render: () => {
    const [imageStates, setImageStates] = useState({
      valid: 'loading' as 'loading' | 'loaded' | 'error',
      broken: 'loading' as 'loading' | 'loaded' | 'error',
    })

    return (
      <div className="space-y-8">
        <div>
          <h3 className="text-lg font-semibold mb-4">Image States</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            
            {/* Loading State */}
            <div className="text-center">
              <div className="w-32 h-32 bg-gray-200 dark:bg-gray-700 animate-pulse rounded mb-2" />
              <p className="text-sm font-medium">Loading</p>
              <p className="text-xs text-gray-500">Placeholder while loading</p>
            </div>

            {/* Valid Image */}
            <div className="text-center">
              <GameImage
                src="https://cf.geekdo-images.com/yLZJCVLlIx4c7eJEWUNJ7w__itemrep/img/Vxxy__bDYKWQMTOHAE9rJUdxM9o=/fit-in/246x300/filters:strip_icc()/pic4458123.jpg"
                alt="Wingspan"
                name="Wingspan"
                variant="square"
                className="w-32 h-32 mb-2"
              />
              <p className="text-sm font-medium">Loaded</p>
              <p className="text-xs text-gray-500">Valid image loaded</p>
            </div>

            {/* Error/Fallback State */}
            <div className="text-center">
              <GameImage
                src="https://invalid-url-that-will-fail.jpg"
                alt="Azul"
                name="Azul"
                variant="square"
                className="w-32 h-32 mb-2"
              />
              <p className="text-sm font-medium">Error</p>
              <p className="text-xs text-gray-500">Falls back to generated image</p>
            </div>

            {/* No Image */}
            <div className="text-center">
              <GameImage
                src={null}
                alt="Splendor"
                name="Splendor"
                variant="square"
                className="w-32 h-32 mb-2"
              />
              <p className="text-sm font-medium">No Image</p>
              <p className="text-xs text-gray-500">No URL provided</p>
            </div>
          </div>
        </div>
      </div>
    )
  },
}

export const VariantComparison: Story = {
  render: () => (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Variant Comparison</h3>
        <div className="flex items-start gap-8">
          <div className="text-center">
            <GameImage
              src="https://cf.geekdo-images.com/yLZJCVLlIx4c7eJEWUNJ7w__itemrep/img/Vxxy__bDYKWQMTOHAE9rJUdxM9o=/fit-in/246x300/filters:strip_icc()/pic4458123.jpg"
              alt="Wingspan"
              name="Wingspan"
              variant="square"
              className="w-40 h-40 mb-3"
            />
            <p className="text-sm font-medium">Square Variant</p>
            <p className="text-xs text-gray-500">Full size with title overlay</p>
          </div>
          
          <div className="text-center">
            <GameImage
              src="https://cf.geekdo-images.com/yLZJCVLlIx4c7eJEWUNJ7w__thumb/img/ZPTOLpQKdTbPmtF3VGXz5VnGLxs=/fit-in/200x150/filters:strip_icc()/pic4458123.jpg"
              alt="Wingspan"
              name="Wingspan"
              variant="thumb"
              className="mb-3"
            />
            <p className="text-sm font-medium">Thumb Variant</p>
            <p className="text-xs text-gray-500">Fixed 80x80px size</p>
          </div>
        </div>
      </div>
    </div>
  ),
}

export const GameCollection: Story = {
  render: () => {
    const games = [
      { name: 'Wingspan', image: 'https://cf.geekdo-images.com/yLZJCVLlIx4c7eJEWUNJ7w__thumb/img/ZPTOLpQKdTbPmtF3VGXz5VnGLxs=/fit-in/200x150/filters:strip_icc()/pic4458123.jpg' },
      { name: 'Azul', image: null },
      { name: 'Ticket to Ride', image: 'https://invalid-url.jpg' },
      { name: 'Splendor', image: null },
      { name: 'King of Tokyo', image: null },
      { name: 'Pandemic', image: null },
      { name: 'Catan', image: null },
      { name: 'Gloomhaven', image: null },
    ]

    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Mixed Game Collection</h3>
        <p className="text-sm text-gray-600">Shows mix of real images, broken images, and fallbacks</p>
        <div className="grid grid-cols-4 gap-4">
          {games.map((game) => (
            <div key={game.name} className="text-center">
              <GameImage
                src={game.image}
                alt={game.name}
                name={game.name}
                variant="square"
                className="w-24 h-24 mb-2"
              />
              <p className="text-xs text-gray-600 truncate">{game.name}</p>
            </div>
          ))}
        </div>
      </div>
    )
  },
}
