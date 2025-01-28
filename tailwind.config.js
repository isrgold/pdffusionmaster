/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
  './src/**/*.{js,jsx,ts,tsx}', // This tells Tailwind to scan your JavaScript and TypeScript files
  './node_modules/@shadcn/ui/**/*.{js,ts,jsx,tsx}',
],
theme: {
	extend: {
		borderRadius: {
			lg: 'var(--radius)',
			md: 'calc(var(--radius) - 2px)',
			sm: 'calc(var(--radius) - 4px)'
		},
		colors: {}
	}
},
plugins: [require("tailwindcss-animate")],
};

