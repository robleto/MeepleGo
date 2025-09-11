import React from 'react';
import type { Meta, StoryObj } from '@storybook/react';

interface Thumb { id: string; name: string; thumbnail_url?: string | null }

const thumbs: Thumb[] = Array.from({ length: 5 }).map((_, i) => ({
  id: 'g'+i,
  name: ['Wingspan','Gloomhaven','Ark Nova','Brass: Birmingham','Azul'][i] || 'Game '+i,
  thumbnail_url: 'https://placehold.co/80x100?text=' + (i+1)
}));

const meta: Meta = {
  title: 'Components/FannedGameImages',
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
    docs: { 
      description: { 
        component: 'Atomic visual pattern: fanned stack of up to 5 game thumbnails used in ListCard header.' 
      } 
    }
  }
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <div className="h-40 w-full flex items-center justify-center bg-gray-50 rounded-xl relative overflow-hidden">
      <div className="relative w-64 h-32">
        {thumbs.map((g, index) => {
          const rotation = (index - 2) * 8;
          const xOffset = (index - 2) * 14;
          const zIndex = thumbs.length - index;
          return (
            <div
              key={g.id}
              className="absolute w-16 h-20 rounded-md shadow-lg"
              style={{ transform: `rotate(${rotation}deg) translateX(${xOffset}px)`, zIndex }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={g.thumbnail_url || ''} alt={g.name} className="w-full h-full object-cover rounded-md border-2 border-white" />
            </div>
          );
        })}
      </div>
    </div>
  ),
};

export const CustomImages: Story = {
  render: () => (
    <div className="h-40 w-full flex items-center justify-center bg-gray-50 rounded-xl relative overflow-hidden">
      <div className="relative w-72 h-32">
        {thumbs.slice(0,4).map((g, index) => {
          const rotation = (index - 1.5) * 10;
          const xOffset = (index - 1.5) * 18;
          const zIndex = thumbs.length - index;
          return (
            <div
              key={g.id}
              className="absolute w-20 h-24 rounded-lg shadow-lg"
              style={{ transform: `rotate(${rotation}deg) translateX(${xOffset}px)`, zIndex }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`https://placehold.co/96x120?text=${index+1}`} alt={g.name} className="w-full h-full object-cover rounded-lg border-2 border-white" />
            </div>
          );
        })}
      </div>
    </div>
  ),
};