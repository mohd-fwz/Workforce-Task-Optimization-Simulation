/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'dark-bg': '#f1f5f9',
        'dark-surface': '#ffffff',
        'dark-border': '#e2e8f0',
        'accent-blue': '#3b82f6',
        'accent-purple': '#6366f1',
        'accent-green': '#10b981',
        'accent-red': '#ef4444',
        'accent-yellow': '#f59e0b',
      },
    },
  },
  plugins: [],
}
