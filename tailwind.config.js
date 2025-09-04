/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  safelist: [
    // Ensure NEW rating colors are never purged - Notion-inspired color scheme
    'bg-red-400', 'text-white',       // 1 - Red
    'bg-orange-400', 'text-white',    // 2 - Orange  
    'bg-amber-400', 'text-white',     // 3 - Amber
    'bg-yellow-400', 'text-gray-900', // 4 - Yellow
    'bg-lime-400', 'text-gray-900',   // 5 - Lime
    'bg-green-400', 'text-white',     // 6 - Green
    'bg-emerald-400', 'text-white',   // 7 - Emerald
    'bg-teal-400', 'text-white',      // 8 - Teal
    'bg-cyan-400', 'text-white',      // 9 - Cyan
    'bg-purple-400', 'text-white',    // 10 - Purple
    'text-gray-500', 'bg-white/70', 'backdrop-blur', // Empty state
    // Award category dynamic color utilities (from awards.json) safelisted so JIT doesn't purge
    { pattern: /(bg|border|text)-(amber|yellow|green|blue|rose|violet|fuchsia|orange|cyan|emerald|teal|slate|pink|indigo|lime)-(50|200|600)/ },
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          light: '#2695E2', // light mode primary accent (hover/alt in dark)
          DEFAULT: '#096EC2', // core brand blue (logo "Go")
          dark: '#074f8a', // pressed / darker shade
          ring: '#1d7fd8', // focus ring accent
          subtle: '#E7F4FF', // bg subtle tint
        },
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
  sans: ['var(--font-inter)', 'Proxima Nova', 'Inter', 'system-ui', 'sans-serif'],
  display: ['Rift Soft', 'var(--font-display)', 'Outfit', 'Inter', 'system-ui', 'sans-serif'],
  // Optional prestige set (mapped via globals.css by toggling html.typography-b)
  prestige: ['var(--font-award-b)', 'Fraunces', 'var(--font-display)', 'serif'],
  prestigeAlt: ['var(--font-award-b-alt)', 'Playfair Display', 'Fraunces', 'serif'],
  poster: ['var(--font-award-poster)', 'Archivo Black', 'var(--font-display)', 'sans-serif'],
  softdisplay: ['var(--font-display-soft)', 'Epilogue', 'var(--font-display)', 'Outfit', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        'minus-half': '-0.5px',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
