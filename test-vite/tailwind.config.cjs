module.exports = {
    content: ['./test-vite/repository/**/*.{html,js}'],
    theme: {
        extend: {},
    },
    plugins: [require('@tailwindcss/typography'), require('daisyui')],
};
