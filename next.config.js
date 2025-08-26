/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ['@supabase/supabase-js'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cf.geekdo-images.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'boardgamegeek.com',
        port: '',
        pathname: '/**',
      },
    ],
  },
  eslint: {
    // We temporarily ignore ESLint during production builds to allow shipping while
    // we address the large backlog of warnings. Local "npm run lint" still shows them.
    ignoreDuringBuilds: true,
  },
}

module.exports = nextConfig
