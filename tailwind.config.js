/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './lib/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg:        '#0a0a0f',
          panel:     '#0f1512',
          accent:    '#10b981',
          'accent-dim': 'rgba(16,185,129,0.15)',
          border:    'rgba(255,255,255,0.08)',
          'border-active': 'rgba(16,185,129,0.4)',
          primary:   '#ecfdf5',
          secondary: '#6ee7b7',
          muted:     '#4b6b5a',
          danger:    '#ef4444',
          success:   '#22c55e',
        }
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        float:  '0 8px 40px rgba(0,0,0,0.6)',
        accent: '0 0 20px rgba(255,215,0,0.3)',
      },
      keyframes: {
        blink: {
          '0%, 100%': { opacity: '1' },
          '50%':      { opacity: '0.3' },
        },
        'pulse-rec': {
          '0%, 100%': { boxShadow: '0 0 0 0 rgba(255,77,109,0.4)' },
          '50%':      { boxShadow: '0 0 0 8px rgba(255,77,109,0)' },
        },
      },
      animation: {
        blink:      'blink 2s ease-in-out infinite',
        'pulse-rec':'pulse-rec 1s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
