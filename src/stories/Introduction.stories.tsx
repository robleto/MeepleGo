import type { Meta, StoryObj } from '@storybook/nextjs-vite'

// Simple documentation component
const IntroductionPage = () => {
  return (
    <div className="max-w-4xl mx-auto p-8">
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-4 text-gray-900">
          Welcome to MeepleGo Design System
        </h1>
        <p className="text-xl text-gray-600 leading-relaxed">
          A comprehensive component library built specifically for board gaming
          applications. Explore our patterns, controls, and foundations designed
          for the tabletop community.
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-8 mb-12">
        <div className="bg-amber-50 p-6 rounded-lg">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white font-semibold">
              1
            </span>
            <h3 className="text-lg font-semibold text-gray-900">
              Game-Focused Design
            </h3>
          </div>
          <p className="text-gray-600">
            Every component serves the board gaming community with specialized
            patterns for collections, ratings, and discovery.
          </p>
        </div>

        <div className="bg-orange-50 p-6 rounded-lg">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-8 bg-orange-600 rounded-full flex items-center justify-center text-white font-semibold">
              2
            </span>
            <h3 className="text-lg font-semibold text-gray-900">
              1-10 Rating System
            </h3>
          </div>
          <p className="text-gray-600">
            Distinctive color-coded ratings from Awful (red) to All-Timer (sky
            blue) with meaningful progression.
          </p>
        </div>

        <div className="bg-amber-50 p-6 rounded-lg">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center text-white font-semibold">
              3
            </span>
            <h3 className="text-lg font-semibold text-gray-900">
              Responsive & Accessible
            </h3>
          </div>
          <p className="text-gray-600">
            Mobile-first design with proper semantics, ARIA labels, and keyboard
            navigation for inclusive gaming.
          </p>
        </div>
      </div>

      <div className="prose max-w-none">
        <h2 className="text-2xl font-semibold mb-4 text-gray-900">
          Component Categories
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-2 text-gray-900">
              Foundations
            </h3>
            <p className="text-gray-600 mb-4">
              Core design tokens including colors, typography, spacing, and the
              specialized 1-10 rating system.
            </p>

            <h3 className="text-lg font-medium mb-2 text-gray-900">
              Components
            </h3>
            <p className="text-gray-600 mb-4">
              Complete UI patterns like AwardCard, GameCard, and complex
              interactive components.
            </p>
          </div>
          <div>
            <h3 className="text-lg font-medium mb-2 text-gray-900">Controls</h3>
            <p className="text-gray-600 mb-4">
              Form elements and interactive controls following atomic design
              principles.
            </p>

            <h3 className="text-lg font-medium mb-2 text-gray-900">Elements</h3>
            <p className="text-gray-600">
              Basic building blocks and utility components for building larger
              patterns.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

const meta: Meta = {
  title: 'Introduction',
  component: IntroductionPage,
  parameters: {
    docs: {
      page: () => <IntroductionPage />,
    },
    layout: 'fullscreen',
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Page: Story = {}
