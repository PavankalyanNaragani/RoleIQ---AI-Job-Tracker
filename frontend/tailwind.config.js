/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,jsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand purples
        'brand-purple':  '#7c3aed',
        'brand-purple-light': '#8b5cf6',
        'brand-blue':    '#3b82f6',
        'brand-blue-dark': '#2563eb',

        // Backgrounds (light)
        'bg-base':    '#f5f4ff',
        'bg-surface': '#ffffff',
        'bg-subtle':  '#faf9ff',

        // Text
        'text-heading':  '#1a1040',
        'text-body':     '#4b3f72',
        'text-muted':    '#9589b8',

        // Legacy
        'accent-primary':   '#7c3aed',
        'accent-secondary': '#3b82f6',
      },
      backgroundImage: {
        'gradient-hero':   'linear-gradient(135deg, #7c3aed 0%, #6d28d9 35%, #3b82f6 100%)',
        'gradient-btn':    'linear-gradient(135deg, #7c3aed 0%, #6d28d9 50%, #3b82f6 100%)',
        'gradient-subtle': 'linear-gradient(135deg, rgba(124,58,237,0.06) 0%, rgba(59,130,246,0.04) 100%)',
      },
      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      boxShadow: {
        'card':        '0 1px 3px rgba(0,0,0,0.05), 0 4px 16px rgba(124,58,237,0.07)',
        'card-hover':  '0 4px 24px rgba(124,58,237,0.14)',
        'purple-glow': '0 8px 32px rgba(124,58,237,0.35)',
        'btn':         '0 4px 14px rgba(124,58,237,0.35)',
        'btn-hover':   '0 6px 20px rgba(124,58,237,0.5)',
        'inner-top':   'inset 0 1px 0 rgba(255,255,255,0.15)',
        'accent-glow': '0 0 20px rgba(124,58,237,0.3)',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Outfit', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}