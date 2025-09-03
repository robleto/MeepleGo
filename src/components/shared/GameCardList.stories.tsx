import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import GameCard from './GameCard';

// CLEAN REBUILD: This file was corrupted with duplicate blocks; fully replaced.

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div suppressHydrationWarning>{children}</div>
);

const meta: Meta<typeof GameCard> = {
  title: 'Components/GameCard/List View',
  component: GameCard,
  tags: ['autodocs'],
  decorators: [Story => <Wrapper><Story /></Wrapper>],
  parameters: {
    layout: 'fullscreen',
    docs: { 
      description: { 
        component: 'List view density variants with standardized right-side actions (Played / Own It / Wishlist / Rating).' 
      }
    }
  }
};
export default meta;

type Story = StoryObj<typeof GameCard>;

// Base mock game
const baseGame = {
  id: 'g1', bgg_id: 100, name: 'Wingspan', year_published: 2019,
  image_url: '', thumbnail_url: '', categories: ['Card Game'], mechanics: ['Engine Building'],
  publisher: 'Stonemaier Games', designer: 'Elizabeth Hargrave',
  description: 'A relaxing bird collection game.', min_players: 1, max_players: 5, playtime_minutes: 70,
  honors: [], tagline: 'A beautiful, relaxing bird collection game', summary: 'A relaxing bird game',
  created_at: '', updated_at: '', rank: 1, rating: 8.0, num_ratings: 10000, cached_at: '',
  list_membership: { library: true, wishlist: false },
  ranking: { id: 'r1', user_id: 'u', game_id: 'g1', played_it: true, ranking: 8, notes: null, public_note: null, private_note: null, created_at: '', imported_from: null, updated_at: '' }
};

const wishlistGame = { ...baseGame, id: 'g2', name: 'Gloomhaven', list_membership: { library: false, wishlist: true }, ranking: { ...baseGame.ranking, played_it: false, ranking: null } };
const neutralGame  = { ...baseGame, id: 'g3', name: 'Ark Nova', list_membership: { library: false, wishlist: false }, ranking: { ...baseGame.ranking, ranking: null, played_it: false } };
const bothGame     = { ...baseGame, id: 'g4', name: 'Brass: Birmingham', list_membership: { library: true, wishlist: true }, ranking: { ...baseGame.ranking, ranking: 9 } };

// Density stories
export const ListDetailed: Story = { name: 'Density: Detailed', args: { game: baseGame as any, viewMode: 'list', variant: 'detailed', listRank: 1 } };
export const ListBalanced: Story = { name: 'Density: Balanced', args: { game: baseGame as any, viewMode: 'list', variant: 'balanced', listRank: 1 } };
export const ListCompact:  Story = { name: 'Density: Compact',  args: { game: baseGame as any, viewMode: 'list', variant: 'compact',  listRank: 1 } };

export const ListDensityComparison: Story = {
  name: 'Density: Comparison',
  render: () => (
    <div className="space-y-8 p-6 max-w-4xl">
      <section><h3 className="font-semibold mb-2">Detailed</h3><GameCard game={baseGame as any} viewMode="list" variant="detailed" listRank={1} /></section>
      <section><h3 className="font-semibold mb-2">Balanced</h3><GameCard game={baseGame as any} viewMode="list" variant="balanced" listRank={1} /></section>
      <section><h3 className="font-semibold mb-2">Compact</h3><GameCard game={baseGame as any} viewMode="list" variant="compact" listRank={1} /></section>
    </div>
  )
};

// Action state showcase
export const ActionStates: Story = {
  name: 'Actions: States',
  render: () => (
    <div className="space-y-3 p-6 max-w-4xl">
      <GameCard game={bothGame as any} viewMode="list" variant="balanced" listRank={1} />
      <GameCard game={baseGame as any} viewMode="list" variant="balanced" listRank={2} />
      <GameCard game={wishlistGame as any} viewMode="list" variant="balanced" listRank={3} />
      <GameCard game={neutralGame as any} viewMode="list" variant="balanced" listRank={4} />
      <div className="pt-4 border-t"><GameCard game={bothGame as any} viewMode="list" variant="compact" listRank={1} /></div>
    </div>
  )
};

// Ranked list sample
export const RankedListExample: Story = {
  name: 'Example: Ranked List',
  render: () => {
    const games = [bothGame, baseGame, wishlistGame, neutralGame];
    return (
      <div className="space-y-2 p-6 max-w-4xl">
        {games.map((g, i) => <GameCard key={g.id} game={g as any} viewMode="list" variant="balanced" listRank={i + 1} />)}
      </div>
    );
  }
};
