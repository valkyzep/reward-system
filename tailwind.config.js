/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        poppins: ['Poppins', 'sans-serif'],
      },
      screens: {
        'xs': '375px',  // Small phones (iPhone SE, etc.)
        'sm': '640px',  // Large phones / small tablets
        'md': '768px',  // Tablets
        'lg': '1025px', // Laptops
        'xl': '1280px', // Desktops
        '2xl': '1536px', // Large screens
      },
    },
  },
  plugins: [],
}