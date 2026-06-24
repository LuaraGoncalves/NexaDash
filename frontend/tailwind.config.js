/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        darkBg: '#1e2023',
        cardBg: '#2a2d32',
        accent1: '#ff8c00',
        accent2: '#00d2ff',
        textMain: '#e0e0e0',
        textMuted: '#8b8e92'
      }
    },
  },
  plugins: [],
}
