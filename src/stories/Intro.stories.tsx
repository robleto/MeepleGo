import type { Meta, StoryObj } from '@storybook/nextjs-vite'

const meta: Meta = {
  title: 'Introduction',
  parameters: {
    layout: 'fullscreen',
    docs: {
      page: () => (
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
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              padding: '2rem',
              borderRadius: '12px',
              marginBottom: '2rem',
              color: 'white',
            }}
          >
            <h1 style={{ margin: 0, marginBottom: '0.5rem', fontSize: '2rem' }}>
              🎲 MeepleGo Design System
            </h1>
            <p style={{ margin: 0, opacity: 0.9, fontSize: '1.1rem' }}>
              A comprehensive design system for board game collection
              management, built with Next.js 15 and Tailwind CSS.
            </p>
          </div>

          <h2 style={{ color: '#374151', marginBottom: '1rem' }}>
            What is MeepleGo?
          </h2>
          <p style={{ lineHeight: 1.6, marginBottom: '2rem' }}>
            MeepleGo is a Next.js 15 board game collection management app that
            helps users track, rate, and organize their board game collections.
            This Storybook contains all the components, design tokens, and
            patterns used throughout the application.
          </p>

          <h2 style={{ color: '#374151', marginBottom: '1rem' }}>
            Design Philosophy
          </h2>
          <p style={{ marginBottom: '1rem' }}>
            Our design system is built around these core principles:
          </p>
          <ul
            style={{
              lineHeight: 1.8,
              marginBottom: '2rem',
              paddingLeft: '1.5rem',
            }}
          >
            <li>
              <strong>🎯 Game-Focused</strong>: Every component serves the board
              gaming community
            </li>
            <li>
              <strong>📊 Rating-Centric</strong>: 1-10 rating system with
              meaningful color coding
            </li>
            <li>
              <strong>🎨 Visual Hierarchy</strong>: Clear information
              architecture for complex game data
            </li>
            <li>
              <strong>♿ Accessibility</strong>: Inclusive design for all gaming
              enthusiasts
            </li>
            <li>
              <strong>📱 Responsive</strong>: Works seamlessly across all
              devices
            </li>
          </ul>

          <h2 style={{ color: '#374151', marginBottom: '1rem' }}>
            Rating System Colors
          </h2>
          <p style={{ marginBottom: '1rem' }}>
            MeepleGo uses a distinctive 1-10 rating system with specific colors:
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '1rem',
              margin: '1rem 0 2rem 0',
            }}
          >
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  backgroundColor: '#dc2626',
                  borderRadius: '4px',
                }}
              ></div>
              <span>
                <strong>1-2:</strong> Awful/So Bad
              </span>
            </div>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  backgroundColor: '#d97706',
                  borderRadius: '4px',
                }}
              ></div>
              <span>
                <strong>3-4:</strong> Weak/Meh
              </span>
            </div>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  backgroundColor: '#65a30d',
                  borderRadius: '4px',
                }}
              ></div>
              <span>
                <strong>5-6:</strong> Just OK/Decent
              </span>
            </div>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  backgroundColor: '#059669',
                  borderRadius: '4px',
                }}
              ></div>
              <span>
                <strong>7-8:</strong> Good/Great
              </span>
            </div>
            <div
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <div
                style={{
                  width: '20px',
                  height: '20px',
                  backgroundColor: '#0891b2',
                  borderRadius: '4px',
                }}
              ></div>
              <span>
                <strong>9-10:</strong> Brilliant/All-Timer
              </span>
            </div>
          </div>

          <h2 style={{ color: '#374151', marginBottom: '1rem' }}>
            Component Organization
          </h2>

          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ color: '#4b5563', marginBottom: '0.5rem' }}>
              📖 Foundations
            </h3>
            <p style={{ marginBottom: '1rem', paddingLeft: '1rem' }}>
              Core design tokens including colors, typography, spacing, and
              iconography that form the basis of our design system.
            </p>

            <h3 style={{ color: '#4b5563', marginBottom: '0.5rem' }}>
              🧩 Components
            </h3>
            <p style={{ marginBottom: '1rem', paddingLeft: '1rem' }}>
              Main user interface components like cards, showcases, popups, and
              search interfaces used throughout the application.
            </p>

            <h3 style={{ color: '#4b5563', marginBottom: '0.5rem' }}>
              🎛️ Controls
            </h3>
            <p style={{ marginBottom: '1rem', paddingLeft: '1rem' }}>
              Atomic form controls and interactive elements including inputs,
              buttons, and toggle groups.
            </p>

            <h3 style={{ color: '#4b5563', marginBottom: '0.5rem' }}>
              🔧 Elements
            </h3>
            <p style={{ marginBottom: '1rem', paddingLeft: '1rem' }}>
              Basic UI building blocks and atomic design elements that compose
              larger components.
            </p>

            <h3 style={{ color: '#4b5563', marginBottom: '0.5rem' }}>
              📦 Archived
            </h3>
            <p style={{ marginBottom: '2rem', paddingLeft: '1rem' }}>
              Legacy components and features maintained for reference but not
              actively used in current designs.
            </p>
          </div>

          <h2 style={{ color: '#374151', marginBottom: '1rem' }}>Tech Stack</h2>
          <ul
            style={{
              lineHeight: 1.6,
              marginBottom: '2rem',
              paddingLeft: '1.5rem',
            }}
          >
            <li>
              <strong>Framework</strong>: Next.js 15 with App Router
            </li>
            <li>
              <strong>Styling</strong>: Tailwind CSS v3.4
            </li>
            <li>
              <strong>Database</strong>: Supabase with Row Level Security
            </li>
            <li>
              <strong>Components</strong>: Functional React components with
              TypeScript
            </li>
            <li>
              <strong>Animations</strong>: GSAP for complex interactions
            </li>
            <li>
              <strong>Drag & Drop</strong>: @dnd-kit for sortable lists
            </li>
          </ul>

          <div
            style={{
              background: '#f3f4f6',
              padding: '1.5rem',
              borderRadius: '8px',
              marginTop: '2rem',
              borderLeft: '4px solid #f59e0b',
            }}
          >
            <h3 style={{ margin: 0, marginBottom: '0.5rem', color: '#374151' }}>
              🚀 Ready to explore?
            </h3>
            <p style={{ margin: 0, color: '#4b5563' }}>
              Check out the <strong>Get Started</strong> page for implementation
              guidelines, or dive into the
              <strong> Foundations</strong> section to understand our design
              tokens.
            </p>
          </div>
        </div>
      ),
    },
  },
}

export default meta

export const Welcome = {}
