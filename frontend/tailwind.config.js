/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: '#111827',
        slate: '#1E293B',
        indigo: { DEFAULT: '#6366F1', light: '#818CF8' },
        violet: { DEFAULT: '#8B5CF6' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
