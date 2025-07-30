/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // 🌿 Palette Ecolojia existante (gardée)
        'eco': {
          leaf: '#6BDF44',
          text: '#1E3D2B', 
          glow: '#A3C75A',
          olive: '#555B1B',
        },
        // 🌿 Ajout des couleurs manquantes pour compatibilité
        'eco-leaf': {
          DEFAULT: '#6BDF44', // Utilise ta couleur existante
          50: '#F7FCF2',
          100: '#EDF8E4', 
          200: '#DAF0CA',
          300: '#C0E5A8',
          400: '#A5DA86',
          500: '#6BDF44', // Ta couleur principale
          600: '#5ABE29',
          700: '#4A9F22',
          800: '#3D831D',
          900: '#326B18',
          950: '#1A3A0C',
          // Variantes pour hover states
          'dark': '#5ABE29'
        },
        'eco-text': {
          DEFAULT: '#1E3D2B', // Ta couleur existante
          50: '#F6F8F6',
          100: '#E8F2EA',
          200: '#D1E5D6', 
          300: '#A8CEB2',
          400: '#7AB187',
          500: '#549465',
          600: '#417850',
          700: '#366142',
          800: '#2E4F37',
          900: '#1E3D2B', // Ta couleur principale
          950: '#0F1E16'
        },
        'eco-bg': {
          DEFAULT: '#F7F9F4',
          50: '#FEFFFE',
          100: '#F7F9F4',
          200: '#EEF4E6',
          300: '#E1EBD5',
          400: '#D0DFC0',
          500: '#BDD2A8',
          600: '#A5C18E',
          700: '#8BAD73',
          800: '#72955B',
          900: '#5E7A4A'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      backgroundImage: {
        'eco-gradient': 'linear-gradient(135deg, #A3C75A 0%, #F5F7F0 100%)', // Ta config existante
      },
      // 🎨 Ajout des animations pour les composants
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'fade-in-up': 'fadeInUp 0.3s ease-out forwards', 
        'pulse-eco': 'pulseEco 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'slide-up': 'slideUp 0.3s ease-out'
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(-10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' }
        },
        pulseEco: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' }
        },
        slideUp: {
          '0%': { transform: 'translateY(100%)' },
          '100%': { transform: 'translateY(0)' }
        }
      }
    },
  },
  plugins: [],
};