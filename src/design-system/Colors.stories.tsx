import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta = {
  title: 'Design System/Colors',
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: 'MeepleGo color system including the 1-10 rating scale colors.',
      },
    },
  },
} satisfies Meta

export default meta
type Story = StoryObj<Meta>

const getRatingColor = (rating: number): string => {
  const colors: { [key: number]: string } = {
    1: 'bg-red-600',
    2: 'bg-orange-600', 
    3: 'bg-amber-600',
    4: 'bg-yellow-600',
    5: 'bg-lime-600',
    6: 'bg-green-600',
    7: 'bg-emerald-600',
    8: 'bg-teal-600',
    9: 'bg-cyan-600',
    10: 'bg-sky-600'
  }
  return colors[rating] || 'bg-gray-400'
}

const ColorSwatch = ({ 
  color, 
  label, 
  description, 
  hexValue,
  copyable = false 
}: { 
  color: string
  label: string
  description: string
  hexValue?: string
  copyable?: boolean
}) => {
  const handleCopy = () => {
    if (hexValue) {
      navigator.clipboard.writeText(hexValue)
    }
  }

  return (
    <div 
      className={`flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow ${copyable ? 'cursor-pointer' : ''}`}
      onClick={copyable ? handleCopy : undefined}
      title={copyable ? `Click to copy ${hexValue}` : undefined}
    >
      <div className={`w-12 h-12 rounded-md ${color} border border-gray-300 flex-shrink-0`}></div>
      <div className="flex-grow">
        <h4 className="font-medium text-gray-900">{label}</h4>
        <p className="text-sm text-gray-600">{description}</p>
        {hexValue && <code className="text-xs font-mono text-gray-500">{hexValue}</code>}
      </div>
    </div>
  )
}

export const RatingColors: Story = {
  render: () => (
    <div className="space-y-4">
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">1-10 Rating Scale Colors</h2>
        <p className="text-gray-600">Standard color system for game ratings across the application.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ColorSwatch color="bg-red-600" label="1 - Awful" description="red-600" hexValue="#dc2626" copyable />
        <ColorSwatch color="bg-orange-600" label="2 - Bad" description="orange-600" hexValue="#ea580c" copyable />
        <ColorSwatch color="bg-amber-600" label="3 - Poor" description="amber-600" hexValue="#d97706" copyable />
        <ColorSwatch color="bg-yellow-600" label="4 - Below Average" description="yellow-600" hexValue="#ca8a04" copyable />
        <ColorSwatch color="bg-lime-600" label="5 - Average" description="lime-600" hexValue="#65a30d" copyable />
        <ColorSwatch color="bg-green-600" label="6 - Above Average" description="green-600" hexValue="#16a34a" copyable />
        <ColorSwatch color="bg-emerald-600" label="7 - Good" description="emerald-600" hexValue="#059669" copyable />
        <ColorSwatch color="bg-teal-600" label="8 - Very Good" description="teal-600" hexValue="#0d9488" copyable />
        <ColorSwatch color="bg-cyan-600" label="9 - Great" description="cyan-600" hexValue="#0891b2" copyable />
        <ColorSwatch color="bg-sky-600" label="10 - Masterpiece" description="sky-600" hexValue="#0284c7" copyable />
      </div>
      
      <div className="mt-8 p-4 bg-gray-50 rounded-lg">
        <h3 className="font-medium text-gray-900 mb-3">Interactive Rating Demo</h3>
        <div className="grid grid-cols-5 md:grid-cols-10 gap-2">
          {[1,2,3,4,5,6,7,8,9,10].map(rating => (
            <div key={rating} className="text-center">
              <div className={`w-8 h-8 rounded-full ${getRatingColor(rating)} flex items-center justify-center text-white text-sm font-bold mb-1`}>
                {rating}
              </div>
              <span className="text-xs text-gray-600">
                {rating <= 2 ? 'Poor' : rating <= 4 ? 'Below Avg' : rating <= 6 ? 'Average' : rating <= 8 ? 'Good' : 'Great'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  ),
}