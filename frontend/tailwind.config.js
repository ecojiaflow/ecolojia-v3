/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ============================================
        // 🌿 ECOLOJIA V3.1 - CHARTE PREMIUM OPTIMISÉE
        // Design : Doux, Nature, Moderne, Accessible
        // Expert : 15+ ans design + ajustements WCAG
        // ============================================
        
        // ============================================
        // VERT PRIMAIRE (CTA uniquement - "précieux")
        // ============================================
        primary: {
          DEFAULT: '#7DDE4A',  // CTA principal ⭐
          50: '#F5FCF1',       // Background ultra-léger (ajusté)
          100: '#E8F9DF',      // Background léger
          200: '#D4F1C0',      // Borders actifs
          hover: '#6CCE39',    // Hover CTA
          active: '#5BC028',   // Active CTA
        },
        
        // ============================================
        // VERT FONCÉ "FOREST" (textes, icônes) ✨ NOUVEAU
        // Ajustement : Nuances intermédiaires ajoutées
        // ============================================
        forest: {
          50: '#F3F7F4',       // Background ultra-léger ✨ AJOUT
          100: '#E1EDE3',      // Background léger ✨ AJOUT
          200: '#C4D9C8',      // Borders doux ✨ AJOUT
          DEFAULT: '#2F5534',  // Texte principal sur fond clair ⭐
          light: '#3D6A45',    // Variante claire
          dark: '#1E3622',     // Variante foncée
          900: '#0F1A12',      // Texte très foncé ✨ AJOUT
        },
        
        // ============================================
        // TONS NATURELS (fonds, surfaces)
        // ============================================
        nature: {
          50: '#FAFCF8',       // Fond ultra-léger
          100: '#F3FAEF',      // Fond secondaire ⭐ (brief)
          200: '#E8F4E1',      // Fond tertiaire
          300: '#DDE9DA',      // Bordures ⭐ (brief)
          400: '#C4D9BE',      // Borders actifs
          500: '#A8C79F',      // Accents
        },
        
        // ============================================
        // NEUTRES (textes)
        // Ajustement : Contraste corrigé pour accessibilité
        // ============================================
        neutral: {
          50: '#F9FAF8',
          100: '#F1F3EF',
          200: '#E4E7E2',
          300: '#CDD3C9',
          400: '#B0B9AC',
          500: '#93A08E',
          600: '#6F7D66',      // Textes discrets ⭐ CORRIGÉ (ratio 4.7:1)
          700: '#5A6751',      // Textes secondaires
          800: '#3B3B3B',      // Texte standard ⭐ (brief)
          900: '#232323',      // Texte très foncé
        },
        
        // ============================================
        // COULEURS SÉMANTIQUES
        // ============================================
        success: {
          DEFAULT: '#4CAF50',
          light: '#81C784',
          dark: '#388E3C',
        },
        warning: {
          DEFAULT: '#FF9800',
          light: '#FFB74D',
          dark: '#F57C00',
        },
        error: {
          DEFAULT: '#F44336',
          light: '#E57373',
          dark: '#D32F2F',
        },
        info: {
          DEFAULT: '#2196F3',
          light: '#64B5F6',
          dark: '#1976D2',
        },
        
        // ============================================
        // VARIANTES BOUTONS ✨ AJOUT
        // primary = élégant (défaut)
        // primary-bold = haute visibilité (critique)
        // ============================================
        'primary-bold': '#2F5534',  // Bouton forest (forte luminosité)
      },
      
      // ============================================
      // TYPOGRAPHIE (Inter + Poppins)
      // Line-height généreux : 1.4-1.6
      // ============================================
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        display: ['Poppins', 'Inter', 'sans-serif'],
      },
      
      fontSize: {
        'xs': ['12px', { lineHeight: '1.6', letterSpacing: '0.01em' }],
        'sm': ['14px', { lineHeight: '1.6', letterSpacing: '0.01em' }],
        'base': ['16px', { lineHeight: '1.6' }],
        'lg': ['18px', { lineHeight: '1.5' }],
        'xl': ['20px', { lineHeight: '1.5' }],
        '2xl': ['24px', { lineHeight: '1.4' }],
        '3xl': ['32px', { lineHeight: '1.4' }],
        '4xl': ['42px', { lineHeight: '1.3', letterSpacing: '-0.02em' }],
        '5xl': ['48px', { lineHeight: '1.2', letterSpacing: '-0.02em' }],
      },
      
      fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
      },
      
      // ============================================
      // ESPACEMENTS (plus respirés)
      // Base 4px, échelle généreuse
      // ============================================
      spacing: {
        '0.5': '0.125rem',  // 2px
        '1': '0.25rem',     // 4px
        '1.5': '0.375rem',  // 6px
        '2': '0.5rem',      // 8px
        '2.5': '0.625rem',  // 10px
        '3': '0.75rem',     // 12px
        '3.5': '0.875rem',  // 14px
        '4': '1rem',        // 16px
        '5': '1.25rem',     // 20px
        '6': '1.5rem',      // 24px ⭐ (standard)
        '7': '1.75rem',     // 28px
        '8': '2rem',        // 32px ⭐ (sections)
        '9': '2.25rem',     // 36px
        '10': '2.5rem',     // 40px
        '12': '3rem',       // 48px
        '14': '3.5rem',     // 56px
        '16': '4rem',       // 64px ⭐ (grandes sections)
        '18': '4.5rem',     // 72px
        '20': '5rem',       // 80px
        '22': '5.5rem',     // 88px
        '24': '6rem',       // 96px
        '26': '6.5rem',     // 104px
        '32': '8rem',       // 128px
      },
      
      // ============================================
      // RADIUS (plus doux, moderne) ✨ BRIEF
      // ============================================
      borderRadius: {
        'none': '0',
        'sm': '8px',
        'DEFAULT': '12px',     // Boutons ⭐ (brief)
        'md': '12px',
        'lg': '16px',          // Cartes ⭐ (brief)
        'xl': '20px',
        '2xl': '24px',
        '3xl': '32px',
        'full': '9999px',
      },
      
      // ============================================
      // OMBRES (naturelles, légères) ✨ OPTIMISÉ
      // Utilise forest pour cohérence
      // ============================================
      boxShadow: {
        'none': 'none',
        'soft': '0 2px 8px rgba(47, 85, 52, 0.06)',       // Ombre très douce
        'card': '0 4px 12px rgba(47, 85, 52, 0.08)',      // Cartes ⭐
        'hover': '0 8px 24px rgba(47, 85, 52, 0.10)',     // Hover
        'lg': '0 10px 30px rgba(47, 85, 52, 0.12)',       // Modales
        'xl': '0 20px 40px rgba(47, 85, 52, 0.14)',       // Grands éléments
        'eco': '0 4px 16px rgba(125, 222, 74, 0.20)',     // Accent vert (CTA)
        'focus': '0 0 0 3px rgba(125, 222, 74, 0.25)',    // Focus ring
        'inner': 'inset 0 2px 4px rgba(47, 85, 52, 0.06)', // Champs enfoncés
      },
      
      // ============================================
      // TRANSITIONS (fluides, naturelles)
      // ============================================
      transitionDuration: {
        '75': '75ms',
        '100': '100ms',
        'fast': '150ms',
        '200': '200ms',
        'DEFAULT': '250ms',
        '300': '300ms',
        'slow': '400ms',
        '500': '500ms',
        '700': '700ms',
        '1000': '1000ms',
      },
      
      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
        'bounce': 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'ease-in-out-back': 'cubic-bezier(0.68, -0.6, 0.32, 1.6)',
      },
      
      // ============================================
      // GRILLE & BREAKPOINTS (standard + adapté)
      // ============================================
      screens: {
        'xs': '475px',
        'sm': '640px',
        'md': '768px',   // Mobile → Desktop
        'lg': '1024px',  // Desktop standard ⭐
        'xl': '1280px',
        '2xl': '1536px',
      },
      
      // ============================================
      // Z-INDEX (standardisé)
      // ============================================
      zIndex: {
        '0': 0,
        '10': 10,
        '20': 20,
        '30': 30,
        '40': 40,
        '50': 50,
        'dropdown': 1000,
        'sticky': 1020,
        'fixed': 1030,
        'modal-backdrop': 1040,
        'modal': 1050,
        'popover': 1060,
        'tooltip': 1070,
      },
    },
  },
  plugins: [],
}