import type { GameCardData } from '@/components/v2/GameCard'

export const mockGames: GameCardData[] = [
  {
    id: '1',
    name: 'Wingspan',
    year: 2019,
    thumbnailUrl: 'https://cf.geekdo-images.com/yLZJCVLlIx4c7eJEWUNJ7w__itemrep/img/6fR8dOKkocpMhFvA4C4r35vkn0o=/fit-in/246x300/filters:strip_icc()/pic4458123.jpg',
    rating: 8.1,
  },
  {
    id: '2',
    name: 'Root',
    year: 2018,
    thumbnailUrl: 'https://cf.geekdo-images.com/JUAUWaVUzeBgzirhZNmHHw__itemrep/img/GnM__bOZ6RVnpX7mftHn67T7J1k=/fit-in/246x300/filters:strip_icc()/pic4254509.jpg',
    rating: 8.0,
  },
  {
    id: '3',
    name: 'Ark Nova',
    year: 2021,
    thumbnailUrl: 'https://cf.geekdo-images.com/6uGUwS8s2vVD0yGHj74X4Q__itemrep/img/1gCwU4iK4f9lwA0U7ybJR3_IaDI=/fit-in/246x300/filters:strip_icc()/pic6293412.jpg',
    rating: 8.5,
  },
  {
    id: '4',
    name: 'Azul',
    year: 2017,
    thumbnailUrl: 'https://cf.geekdo-images.com/3J8y9kCqEh4gP5xZ4a4grA__itemrep/img/GE5mA0O7lK1m09k3ZkCPMgyb8eE=/fit-in/246x300/filters:strip_icc()/pic3718275.jpg',
    rating: 7.8,
  },
  {
    id: '5',
    name: 'The Crew: Mission Deep Sea',
    year: 2021,
    thumbnailUrl: 'https://cf.geekdo-images.com/2G9y2D5bQmcdx1kqJ1sQ7A__itemrep/img/4jx8xi9q0ufbW1d1GWUIJ3E0ffU=/fit-in/246x300/filters:strip_icc()/pic5988514.jpg',
    rating: 8.1,
  },
  {
    id: '6',
    name: 'Cascadia',
    year: 2021,
    thumbnailUrl: 'https://cf.geekdo-images.com/MjeJQx2v_LhDqZZ6C0eGJw__itemrep/img/8j2P-aKn4ogDXN4QyFJcJtch7GU=/fit-in/246x300/filters:strip_icc()/pic5100691.jpg',
    rating: 8.0,
  },
  {
    id: '7',
    name: 'Dune: Imperium',
    year: 2020,
    thumbnailUrl: 'https://cf.geekdo-images.com/PhjygpWSo-0labGrPBMyyg__itemrep/img/4Zb_Iib1TnW1zOvVQK7F8tQIv_0=/fit-in/246x300/filters:strip_icc()/pic5666597.jpg',
    rating: 8.3,
  },
  {
    id: '8',
    name: 'The Mind',
    year: 2018,
    thumbnailUrl: 'https://cf.geekdo-images.com/UKgmLBOmeqVfm4ZwO2hRzw__itemrep/img/1X7FDm8yU9lKc2V8nA4J9Y5M4fQ=/fit-in/246x300/filters:strip_icc()/pic3979765.jpg',
    rating: 7.7,
  },
]

export const rails = [
  {
    title: 'Recently Played',
    subtitle: 'Your latest sessions at a glance',
    games: mockGames,
  },
  {
    title: 'Top Rated Classics',
    subtitle: 'Community favorites that always deliver',
    games: mockGames.slice(2),
  },
  {
    title: 'Quick Play Picks',
    subtitle: 'Short, sharp, and perfect for weeknights',
    games: mockGames.slice(0, 6),
  },
  {
    title: 'Wishlist Momentum',
    subtitle: 'Trending additions to consider next',
    games: mockGames.slice(1, 7),
  },
]
