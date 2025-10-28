/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // CHARTE ECOLOJIA - ÉCHELLE COMPLÈTE
        primary: {
          50: '#F3FBEA',   // Background ultra-léger ✅
          100: '#E9F8DF',  // Background léger ✅
          200: '#D4F1C0',  // Borders actifs
          300: '#B7E99C',  // Accents doux
          400: '#98E073',  // Secondary CTA
          500: '#7DDE4A',  // CTA principal (défaut)
          600: '#5FC72F',  // Hover CTA
          700: '#489E26',  // Active CTA
          800: '#377A1F',  // Texte sur fond clair
          900: '#295D19',  // Texte foncé
        },
        forest: '#236D3E',       // Accents premium
        secondary: '#E9F8DF',    // Alias primary-100
        background: '#FFFFFF',
        bgSecondary: '#F7F9F4',
        
        // Neutrals (pour textes lisibles)
        neutral: {
          50: '#F9FAF8',
          100: '#F7F9F4',
          200: '#EDF2EA',
          300: '#DDE9DA',
          600: '#6B6B6B',
          700: '#4A4A4A',
          800: '#3B3B3B',
          900: '#232323',
        }
      },
    },
  },
  plugins: [],
}