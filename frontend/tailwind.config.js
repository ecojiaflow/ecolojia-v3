/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // CHARTE ECOLOJIA
        primary: '#7DDE4A',      // Vert primaire
        secondary: '#E9F8DF',    // Vert secondaire clair
        background: '#FFFFFF',   // Blanc fond
        bgSecondary: '#F7F9F4',  // Gris clair sections
        text: '#3B3B3B',         // Gris texte
        border: '#DDE9DA',       // Gris pale bordures
        
        // Emerald (existant - compatibilite)
        emerald: {
          50: '#ecfdf5',
          100: '#d1fae5',
          200: '#a7f3d0',
          300: '#6ee7b7',
          400: '#34d399',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'], // Police ECOLOJIA
      },
      fontSize: {
        'display': '48px',  // H1
        'heading': '32px',  // H2
        'body': '16px',     // Texte courant
        'small': '14px',    // Tags
      },
      borderRadius: {
        'card': '16px',     // Cartes ECOLOJIA
      },
      spacing: {
        'section': '64px',  // Espacement sections
      }
    },
  },
  plugins: [],
}