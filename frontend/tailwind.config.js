module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}', './public/index.html'],
  theme: {
    extend: {
      colors: {
        slatebg: '#f3f7fb',
        ink: '#0f172a',
        ocean: '#0f766e',
        sunrise: '#f97316',
      },
      fontFamily: {
        display: ['Poppins', 'sans-serif'],
        body: ['Manrope', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
