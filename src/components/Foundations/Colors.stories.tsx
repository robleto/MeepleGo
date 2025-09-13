import type { Meta, StoryObj } from '@storybook/nextjs-vite'

const meta: Meta = {
  title: 'Foundations/Colors',
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          'Color system including the 1-10 rating scale palette used throughout MeepleGo.',
      },
    },
  },
}
export default meta

const ratingColors = [
  { value: 1, color: 'red-600', label: 'Awful' },
  { value: 2, color: 'orange-600', label: 'Bad' },
  { value: 3, color: 'amber-600', label: 'Poor' },
  { value: 4, color: 'yellow-600', label: 'Below Average' },
  { value: 5, color: 'lime-600', label: 'Average' },
  { value: 6, color: 'green-600', label: 'Above Average' },
  { value: 7, color: 'emerald-600', label: 'Good' },
  { value: 8, color: 'teal-600', label: 'Very Good' },
  { value: 9, color: 'cyan-600', label: 'Great' },
  { value: 10, color: 'sky-600', label: 'Masterpiece' },
]

export const RatingScale: StoryObj = {
  render: () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">1-10 Rating Scale</h3>
      <div className="grid grid-cols-5 gap-4">
        {ratingColors.map(({ value, color, label }) => (
          <div key={value} className="text-center">
            <div
              className={`h-16 w-16 rounded-lg bg-${color} flex items-center justify-center text-white font-bold shadow mx-auto mb-2`}
            >
              {value}
            </div>
            <div className="text-xs font-medium">{label}</div>
          </div>
        ))}
      </div>
    </div>
  ),
}

export const SystemColors: StoryObj = {
  render: () => (
    <div className="space-y-6">
      <div>
        <h4 className="text-md font-semibold mb-3">Grays</h4>
        <div className="flex gap-2">
          {[
            'gray-50',
            'gray-100',
            'gray-200',
            'gray-300',
            'gray-400',
            'gray-500',
            'gray-600',
            'gray-700',
            'gray-800',
            'gray-900',
          ].map((color) => (
            <div
              key={color}
              className={`h-12 w-12 rounded bg-${color} border`}
              title={color}
            />
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-md font-semibold mb-3">Brand Colors</h4>
        <div className="flex gap-2">
          {[
            'indigo-50',
            'indigo-100',
            'indigo-500',
            'indigo-600',
            'indigo-700',
          ].map((color) => (
            <div
              key={color}
              className={`h-12 w-12 rounded bg-${color} border`}
              title={color}
            />
          ))}
        </div>
      </div>
    </div>
  ),
}
