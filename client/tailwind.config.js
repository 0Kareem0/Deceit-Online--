/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        void: {
          DEFAULT: '#0B0A12',
          surface: '#12101D',
          border: '#1F1B30',
        },
        stone: {
          800: '#231F33',
          900: '#171420',
        },
        gold: {
          light: '#F4D97B',
          DEFAULT: '#D4AF37',
          dark: '#9A7B1C',
        },
        kingdom: {
          DEFAULT: '#2E7D32',
          light: '#4CAF50',
          glow: 'rgba(76, 175, 80, 0.3)',
        },
        shadowFaction: {
          DEFAULT: '#B71C1C',
          light: '#F44336',
          glow: 'rgba(244, 67, 54, 0.3)',
        },
        neutralFaction: {
          DEFAULT: '#6A1B9A',
          light: '#AB47BC',
          glow: 'rgba(171, 71, 188, 0.3)',
        }
      },
      fontFamily: {
        cairo: ['Cairo', 'sans-serif'],
        amiri: ['Amiri', 'serif'],
        kufi: ['Reem Kufi', 'sans-serif'],
        cinzel: ['Cinzel', 'serif'],
      },
      boxShadow: {
        'gold-glow': '0 0 25px rgba(212, 175, 55, 0.25)',
        'shadow-glow': '0 0 25px rgba(183, 28, 28, 0.3)',
        'kingdom-glow': '0 0 25px rgba(46, 125, 50, 0.3)',
      }
    },
  },
  plugins: [],
}
