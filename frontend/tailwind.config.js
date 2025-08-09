/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // KoiCoin Dark Mode Palette
        'koi': {
          'deep': '#0D0F12',      // Deep Charcoal Blue - Background
          'dark': '#1A1F26',      // Slightly lighter for cards
          'orange': '#FF7043',    // Koi Orange - Primary
          'gold': '#FDD835',      // Golden Pond Light - Secondary
          'green': '#2E7D32',     // Lotus Leaf Green - Accent 1
          'blue': '#81D4FA',      // Soft Sky Blue - Accent 2
          'text': '#FFFFFF',      // Pure white text
          'muted': '#B0BEC5',     // Cool gray for secondary text
          'border': '#374151',    // Border color
        }
      },
      backgroundImage: {
        'gradient-koi': 'linear-gradient(135deg, #0D0F12 0%, #1A1F26 100%)',
        'gradient-water': 'linear-gradient(135deg, #0D0F12 0%, #1E3A8A 50%, #0D0F12 100%)',
      }
    },
  },
  plugins: [],
}