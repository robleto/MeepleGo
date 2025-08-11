/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  safelist: [
    // Ensure rating colors are never purged - Reawarding color scheme
    'bg-[#e5dbf3]', 'text-[#4c2c65]', // 10 - Purple
    'bg-[#d5e7f2]', 'text-[#1a3448]', // 9 - Blue
    'bg-[#dcebe3]', 'text-[#1f3c30]', // 8 - Green
    'bg-[#f8e7ba]', 'text-[#5b3d00]', // 7 - Yellow
    'bg-[#f4d8c7]', 'text-[#7b3f00]', // 6 - Orange
    'bg-[#f5d9e8]', 'text-[#6a1f45]', // 5 - Pink
    'bg-[#f6d4d4]', 'text-[#7b1818]', // 4 - Red
    'bg-[#eee0d6]', 'text-[#7b5c42]', // 3 - Beige
    'bg-[#e2e2e2]', 'text-[#474747]', // 2 - Gray
    'bg-[#f5f5f5]', 'text-[#474747]', // 1 - Light Gray
  ],
  theme: {
    extend: {
      colors: {
        // Custom color palette for rankings (matching Reawarding)
        rating: {
          1: '#dc2626', // red-600
          2: '#ea580c', // orange-600
          3: '#d97706', // amber-600
          4: '#ca8a04', // yellow-600
          5: '#65a30d', // lime-600
          6: '#16a34a', // green-600
          7: '#059669', // emerald-600
          8: '#0d9488', // teal-600
          9: '#0891b2', // cyan-600
          10: '#0284c7', // sky-600
        },
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}

