/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#070D18',
          900: '#0A192F', // Deep Midnight Blue
          800: '#112240', // Elevated Slate-Navy
          700: '#1E3A5F',
          600: '#2A4D7C',
        },
        brand: {
          50: '#EFF6FF',
          100: '#DBEAFE',
          500: '#2563EB',
          600: '#1D4ED8',
          700: '#1E40AF',
        },
        accent: {
          amber: '#D97706',
          'amber-light': '#FEF3C7',
          teal: '#0D9488',
          'teal-light': '#CCFBF1',
        }
      },
      fontFamily: {
        sans: ['Inter', 'Noto Sans Ethiopic', 'sans-serif'],
        ethiopic: ['Noto Sans Ethiopic', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
