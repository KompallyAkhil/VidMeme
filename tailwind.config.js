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
          panel:     '#111118',
          accent:    '#ffd700',
          'accent-dim': 'rgba(255,215,0,0.15)',
          border:    'rgba(255,255,255,0.08)',
          'border-active': 'rgba(255,215,0,0.4)',
          primary:   '#f0f0f5',
          secondary: '#8888a0',
          muted:     '#555568',
          danger:    '#ff4d6d',
          success:   '#00e676',
        },
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
