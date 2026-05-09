/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: { 50:'#f0fdf4',100:'#dcfce7',200:'#bbf7d0',300:'#86efac',400:'#4ade80',500:'#22c55e',600:'#16a34a',700:'#15803d',800:'#166534',900:'#14532d' },
        gold: { 50:'#fffbeb',100:'#fef3c7',200:'#fde68a',300:'#fcd34d',400:'#fbbf24',500:'#f59e0b',600:'#d97706',700:'#b45309' },
        islamic: { green:'#1a6b3c', teal:'#0d7377', gold:'#c9a84c', cream:'#faf7f0', dark:'#0f1923', navy:'#1a2744' },
      },
      fontFamily: { arabic: ['Amiri','Scheherazade New','serif'], sans: ['Inter','system-ui','sans-serif'] },
      animation: { 'fade-in':'fadeIn 0.5s ease-in-out', 'slide-up':'slideUp 0.6s ease-out' },
      keyframes: {
        fadeIn: { '0%':{ opacity:'0' }, '100%':{ opacity:'1' } },
        slideUp: { '0%':{ transform:'translateY(20px)', opacity:'0' }, '100%':{ transform:'translateY(0)', opacity:'1' } },
      },
    },
  },
  plugins: [],
};
