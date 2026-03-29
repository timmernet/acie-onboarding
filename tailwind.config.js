/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        army: {
          50:  'rgb(var(--army-50) / <alpha-value>)',
          100: 'rgb(var(--army-100) / <alpha-value>)',
          200: 'rgb(var(--army-200) / <alpha-value>)',
          300: 'rgb(var(--army-300) / <alpha-value>)',
          400: 'rgb(var(--army-400) / <alpha-value>)',
          500: 'rgb(var(--army-500) / <alpha-value>)',
          600: 'rgb(var(--army-600) / <alpha-value>)',
          700: 'rgb(var(--army-700) / <alpha-value>)',
          800: 'rgb(var(--army-800) / <alpha-value>)',
          900: 'rgb(var(--army-900) / <alpha-value>)',
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
