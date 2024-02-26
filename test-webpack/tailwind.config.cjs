module.exports = {
    content: ['./test-webpack/repository/**/*.{html,js}'],
    theme: {
        extend: {},
    },
    plugins: [require('@tailwindcss/typography'), require('daisyui')],
};
