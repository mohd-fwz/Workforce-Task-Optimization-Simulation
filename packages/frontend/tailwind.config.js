/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#0a0e1a',
        'dark-surface': '#131826',
        'dark-border': '#1f2937',
        'accent-blue': '#3b82f6',
        'accent-purple': '#8b5cf6',
        'accent-green': '#10b981',
        'accent-red': '#ef4444',
        'accent-yellow': '#f59e0b',
      },
    },
  },
  plugins: [],
}
