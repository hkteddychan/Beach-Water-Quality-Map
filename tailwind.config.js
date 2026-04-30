/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        beach: {
          good: '#00E676',
          fair: '#FFEB3B',
          poor: '#FF9800',
          verypoor: '#F44336',
          extremely: '#212121',
        }
      },
      fontFamily: {
        sans: ['Noto Sans HK', 'Noto Sans TC', 'system-ui', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
