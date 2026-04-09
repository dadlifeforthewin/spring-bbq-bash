/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      colors: {
        glow: {
          pink: "#ff3ea5",
          purple: "#8b5cf6",
          cyan: "#22d3ee",
          yellow: "#fde047"
        }
      }
    }
  },
  plugins: []
};
