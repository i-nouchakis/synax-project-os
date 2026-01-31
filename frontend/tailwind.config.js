/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // Colors from STYLE-GUIDE.md
      colors: {
        // Backgrounds
        background: {
          DEFAULT: '#0d1117',
          secondary: '#161b22',
          tertiary: '#1c2128',
        },

        // Surfaces
        surface: {
          DEFAULT: '#161b22',
          hover: '#1c2128',
          active: '#262c36',
          border: '#30363d',
        },

        // Primary (Cyan/Teal)
        primary: {
          50: '#ecfeff',
          100: '#cffafe',
          200: '#a5f3fc',
          300: '#67e8f9',
          400: '#22d3ee',
          500: '#06b6d4',
          600: '#0891b2',
          700: '#0e7490',
          800: '#155e75',
          900: '#164e63',
          DEFAULT: '#22d3ee',
        },

        // Semantic Colors
        success: {
          light: '#4ade80',
          DEFAULT: '#22c55e',
          dark: '#16a34a',
          bg: 'rgba(34, 197, 94, 0.1)',
        },

        warning: {
          light: '#fbbf24',
          DEFAULT: '#f59e0b',
          dark: '#d97706',
          bg: 'rgba(245, 158, 11, 0.1)',
        },

        error: {
          light: '#f87171',
          DEFAULT: '#ef4444',
          dark: '#dc2626',
          bg: 'rgba(239, 68, 68, 0.1)',
        },

        info: {
          light: '#60a5fa',
          DEFAULT: '#3b82f6',
          dark: '#2563eb',
          bg: 'rgba(59, 130, 246, 0.1)',
        },

        // Accent Colors
        accent: {
          purple: '#a855f7',
          pink: '#ec4899',
          indigo: '#6366f1',
          teal: '#14b8a6',
          orange: '#f97316',
        },

        // Text Colors
        text: {
          primary: '#f1f5f9',
          secondary: '#94a3b8',
          tertiary: '#64748b',
          disabled: '#475569',
          inverse: '#0f172a',
        },

        // Installation Status Colors
        status: {
          notStarted: '#64748b',
          cabling: '#f59e0b',
          equipment: '#3b82f6',
          config: '#a855f7',
          documentation: '#22d3ee',
          completed: '#22c55e',
        },
      },

      // Typography
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },

      fontSize: {
        'display': ['2.25rem', { lineHeight: '1.2', fontWeight: '700' }],
        'h1': ['1.875rem', { lineHeight: '1.3', fontWeight: '600' }],
        'h2': ['1.5rem', { lineHeight: '1.35', fontWeight: '600' }],
        'h3': ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }],
        'h4': ['1rem', { lineHeight: '1.5', fontWeight: '600' }],
        'body-lg': ['1rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body': ['0.875rem', { lineHeight: '1.6', fontWeight: '400' }],
        'body-sm': ['0.8125rem', { lineHeight: '1.5', fontWeight: '400' }],
        'caption': ['0.75rem', { lineHeight: '1.4', fontWeight: '400' }],
        'tiny': ['0.6875rem', { lineHeight: '1.3', fontWeight: '500' }],
      },

      // Border Radius
      borderRadius: {
        'sm': '4px',
        'DEFAULT': '6px',
        'md': '8px',
        'lg': '12px',
        'xl': '16px',
        '2xl': '20px',
      },

      // Shadows
      boxShadow: {
        'sm': '0 1px 2px 0 rgba(0, 0, 0, 0.3)',
        'DEFAULT': '0 1px 3px 0 rgba(0, 0, 0, 0.4), 0 1px 2px -1px rgba(0, 0, 0, 0.4)',
        'md': '0 4px 6px -1px rgba(0, 0, 0, 0.4), 0 2px 4px -2px rgba(0, 0, 0, 0.4)',
        'lg': '0 10px 15px -3px rgba(0, 0, 0, 0.4), 0 4px 6px -4px rgba(0, 0, 0, 0.4)',
        'xl': '0 20px 25px -5px rgba(0, 0, 0, 0.5), 0 8px 10px -6px rgba(0, 0, 0, 0.5)',
        'inner': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.3)',
        'glow-primary': '0 0 20px rgba(34, 211, 238, 0.3)',
        'glow-success': '0 0 20px rgba(34, 197, 94, 0.3)',
        'glow-error': '0 0 20px rgba(239, 68, 68, 0.3)',
      },

      // Animation
      animation: {
        'fade-in': 'fadeIn 200ms ease-out',
        'slide-up': 'slideUp 200ms ease-out',
        'pulse-slow': 'pulse 3s infinite',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },

      // Spacing (extends default)
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
    },
  },
  plugins: [],
}
