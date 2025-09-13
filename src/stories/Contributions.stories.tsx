import type { Meta, StoryObj } from '@storybook/nextjs-vite'

const ContributionsPage = () => {
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
          background: 'linear-gradient(135deg, #7c3aed 0%, #5b21b6 100%)',
          padding: '2rem',
          borderRadius: '12px',
          marginBottom: '2rem',
          color: 'white',
        }}
      >
        <h1 style={{ margin: 0, marginBottom: '0.5rem', fontSize: '2rem' }}>
          🤝 Contributing Guidelines
        </h1>
        <p style={{ margin: 0, opacity: 0.9, fontSize: '1.1rem' }}>
          Help improve the MeepleGo design system by following these development
          and contribution guidelines.
        </p>
      </div>

      <h2 style={{ color: '#374151', marginBottom: '1rem' }}>
        Development Workflow
      </h2>

      <h3 style={{ color: '#4b5563', marginBottom: '0.5rem' }}>
        1. Component Standards
      </h3>
      <ul
        style={{
          lineHeight: 1.6,
          marginBottom: '1.5rem',
          paddingLeft: '1.5rem',
        }}
      >
        <li>Follow TypeScript interfaces with clear documentation</li>
        <li>Include proper semantic HTML and accessibility features</li>
        <li>Add loading and error states where appropriate</li>
        <li>Use the standardized 1-10 rating color system</li>
      </ul>

      <h3 style={{ color: '#4b5563', marginBottom: '0.5rem' }}>
        2. Storybook Documentation
      </h3>
      <ul
        style={{
          lineHeight: 1.6,
          marginBottom: '1.5rem',
          paddingLeft: '1.5rem',
        }}
      >
        <li>Include multiple variants showing different states</li>
        <li>Document all props with clear descriptions</li>
        <li>Add controls for interactive properties</li>
        <li>Create comprehensive examples</li>
      </ul>

      <h2 style={{ color: '#374151', marginBottom: '1rem' }}>
        Component Categories
      </h2>

      <div style={{ marginBottom: '2rem' }}>
        <ul style={{ lineHeight: 1.8, paddingLeft: '1.5rem' }}>
          <li>
            <strong>🧩 Components</strong>: User-facing interface components
            that combine multiple elements
          </li>
          <li>
            <strong>🎛️ Controls</strong>: Interactive form elements and input
            controls
          </li>
          <li>
            <strong>🔧 Elements</strong>: Basic UI building blocks and atomic
            design elements
          </li>
          <li>
            <strong>📖 Foundations</strong>: Design tokens, colors, typography,
            spacing guidelines
          </li>
          <li>
            <strong>📦 Archived</strong>: Legacy components kept for reference
          </li>
        </ul>
      </div>

      <div
        style={{
          background: '#ecfdf5',
          padding: '1.5rem',
          borderRadius: '8px',
          marginTop: '2rem',
          borderLeft: '4px solid #059669',
        }}
      >
        <h3 style={{ margin: 0, marginBottom: '0.5rem', color: '#047857' }}>
          🎯 Quality Standards
        </h3>
        <p style={{ margin: 0, color: '#065f46' }}>
          Every contribution should improve the user experience for board game
          enthusiasts. Consider performance, accessibility, and maintainability
          in all decisions.
        </p>
      </div>

      <div style={{ marginTop: '2rem', textAlign: 'center' }}>
        <p style={{ fontSize: '1.2rem', color: '#374151' }}>
          <strong>Thank you for contributing to MeepleGo! 🎲</strong>
        </p>
      </div>
    </div>
  )
}

const meta: Meta = {
  title: 'Contributions',
  component: ContributionsPage,
  parameters: {
    docs: {
      page: () => <ContributionsPage />,
    },
    layout: 'fullscreen',
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const Page: Story = {}
