
import type { Meta, StoryObj } from '@storybook/react';
import HeroCTA, { HeroCTAProps } from './AwardsLoggedOutHero';

const meta: Meta<typeof HeroCTA> = {
  title: 'Archived/Features/Awards/AwardsLoggedOutHero',
  component: HeroCTA,
  tags: ['autodocs'],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'Hero section encouraging non-logged-in users to sign up for personal game awards.'
      }
    }
  },
  argTypes: {
    title: { control: 'text' },
    subtitle: { control: 'text' },
    ctaText: { control: 'text' },
    steps: { control: 'object' },
    onCtaClick: { action: 'cta clicked' },
  },
};

export default meta;
type Story = StoryObj<typeof HeroCTA>;

const defaultSteps = [
  {
    icon: <span style={{ display: 'inline-block', width: 20, height: 20, background: '#2563eb', borderRadius: '50%' }} />,
    heading: 'Track played games',
    text: 'Add games to your collection and mark them as Played. The more you log, the richer your awards become.',
  },
  {
    icon: <span style={{ display: 'inline-block', width: 20, height: 20, background: '#f59e42', borderRadius: '50%' }} />,
    heading: 'Rate & rank them',
    text: 'Give each played title a 1–10 rating. Rankings power category insights and help surface standout contenders.',
  },
  {
    icon: <span style={{ display: 'inline-block', width: 20, height: 20, background: '#eab308', borderRadius: '50%' }} />,
    heading: 'Generate & refine awards',
    text: 'We auto‑build personal award categories (Strategy, Family, Party, etc.). Adjust winners manually any time.',
  },
];

export const Default: Story = {
  args: {
    title: 'Create your own Game Awards',
    subtitle: 'Auto‑generate personal awards from the games you play and rate—then fine‑tune the winners.',
    ctaText: 'Sign Up to Get Started',
    steps: defaultSteps,
  },
};
