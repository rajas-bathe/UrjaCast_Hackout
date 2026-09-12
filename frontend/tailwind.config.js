/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        surplus: '#f59e0b',
        shortfall: '#f43f5e',
        normal: '#10b981',
      },
    },
  },
  plugins: [],
}