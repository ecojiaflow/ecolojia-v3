/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html","./src/**/*.{ts,tsx,js,jsx,html}"],
  theme: {
    extend: {
      colors: {
        eco: {
          green: "#7DDE4A",
          "green-100": "#E9F8DF",
          gray: "#3B3B3B",
          "gray-50": "#F7F9F4",
          "gray-100": "#DDE9DA",
          white: "#FFFFFF"
        }
      },
      borderRadius: { "2xl": "1rem" },
      boxShadow: { soft: "0 6px 20px rgba(0,0,0,0.06)" }
    }
  },
  plugins: []
};
