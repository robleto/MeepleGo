/** @type {import('tailwindcss').Config} */
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
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

