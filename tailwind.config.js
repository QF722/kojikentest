/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        zen: ['"Zen Maru Gothic"', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
