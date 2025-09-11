import type { Meta, StoryObj } from '@storybook/react';
import PlayLogEditor from './PlayLogEditor';

const meta: Meta<typeof PlayLogEditor> = {
  title: 'Archived/PlayLogEditor',
  component: PlayLogEditor,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: 'Form component for creating and editing game play logs with date, players, and notes.'
      }
    }
  },
  argTypes: {
    gameId: { control: 'text' },
    gameName: { control: 'text' },
    autoFocus: { control: 'boolean' },
    openForm: { control: 'boolean' },
    onCreated: { action: 'onCreated' },
    onUpdated: { action: 'onUpdated' },
  },
};
export default meta;

type Story = StoryObj<typeof PlayLogEditor>;

export const Default: Story = {
  args: {
    gameId: 'test-game',
    gameName: 'Test Game',
    autoFocus: false,
    openForm: true,
  },
};
