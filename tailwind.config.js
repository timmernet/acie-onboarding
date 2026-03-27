/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        army: {
          50:  '#eef5e8',
          100: '#d4e8c2',
          200: '#aed198',
          300: '#82b469',
          400: '#5e9840',
          500: '#3f7a22',
          600: '#2d5c18',
          700: '#1e4010',
          800: '#14290a',
          900: '#0a1505',
        },
        gold: {
          300: '#f0c96a',
          400: '#e8b030',
          500: '#c8900a',
          600: '#a87008',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
