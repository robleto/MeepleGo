import type { Meta, StoryObj } from '@storybook/nextjs-vite'

const GetStartedPage = () => {
  return (
    <div
      style={{
        padding: '2rem',
        maxWidth: '800px',
        margin: '0 auto',
        fontFamily: 'system-ui',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
          padding: '2rem',
          borderRadius: '12px',
          marginBottom: '2rem',
          color: 'white',
        }}
      >
        <h1 style={{ margin: 0, marginBottom: '0.5rem', fontSize: '2rem' }}>
          🛠️ Implementation Guide
        </h1>
        <p style={{ margin: 0, opacity: 0.9, fontSize: '1.1rem' }}>
          Learn how to use and implement MeepleGo components in your development
          workflow.
        </p>
      </div>

      <h2 style={{ color: '#374151', marginBottom: '1rem' }}>
        Installation & Setup
      </h2>

      <h3 style={{ color: '#4b5563', marginBottom: '0.5rem' }}>
        Prerequisites
      </h3>
      <ul
        style={{
          lineHeight: 1.6,
          marginBottom: '1.5rem',
          paddingLeft: '1.5rem',
        }}
      >
        <li>Node.js 18+</li>
        <li>Next.js 15+</li>
        <li>Tailwind CSS 3.4+</li>
        <li>TypeScript</li>
      </ul>

      <h2 style={{ color: '#374151', marginBottom: '1rem' }}>
        Component Usage
      </h2>
      <p style={{ marginBottom: '1rem' }}>
        Import and use components from the organized structure:
      </p>

      <pre
        style={{
          background: '#f3f4f6',
          padding: '1rem',
          borderRadius: '6px',
          fontSize: '0.9rem',
          overflow: 'auto',
          marginBottom: '2rem',
        }}
      >
        {`// Import components
import { AwardCard, GameCard } from '@/components'
import { SearchInput, FilterButton } from '@/components/controls'

// Use in your JSX
<SearchInput 
  value={query} 
  onChange={setQuery} 
  placeholder="Search games..." 
/>`}
      </pre>

      <div
        style={{
          background: '#fef3c7',
          padding: '1.5rem',
          borderRadius: '8px',
          marginTop: '2rem',
          borderLeft: '4px solid #f59e0b',
        }}
      >
        <h3 style={{ margin: 0, marginBottom: '0.5rem', color: '#92400e' }}>
          💡 Need Help?
        </h3>
        <p style={{ margin: 0, color: '#92400e' }}>
          Check the <strong>Contributions</strong> page for development
          guidelines, or explore individual component stories for detailed
          examples and props documentation.
        </p>
      </div>
    </div>
  )
}

const meta: Meta = {
  title: 'Get Started',
  component: GetStartedPage,
  parameters: {
    docs: {
      page: () => <GetStartedPage />,
    },
    layout: 'fullscreen',
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Page: Story = {}
