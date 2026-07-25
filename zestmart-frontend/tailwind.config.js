/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ivory: '#FAF6EC',
        paper: '#FFFDF9',
        ink: '#211D1A',
        teal: {
          DEFAULT: '#0F4C4C',
          50: '#E6EEEE',
          100: '#CCDDDC',
          400: '#1A6B67',
          600: '#0F4C4C',
          700: '#0A3535',
          900: '#062323',
        },
        marigold: {
          DEFAULT: '#E8A33D',
          50: '#FDF3E2',
          100: '#FBE7C4',
          400: '#EEB55C',
          600: '#E8A33D',
          700: '#C77F1D',
        },
        maroon: {
          DEFAULT: '#7A1F3D',
          600: '#7A1F3D',
          700: '#5E1730',
        },
        sand: '#EFE6D6',
      },
      fontFamily: {
        display: ['"Fraunces"', 'serif'],
        body: ['"Manrope"', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(33,29,26,0.06), 0 8px 24px -12px rgba(33,29,26,0.18)',
        glow: '0 0 0 1px rgba(232,163,61,0.25), 0 12px 32px -8px rgba(15,76,76,0.35)',
        glass: '0 8px 32px rgba(15,76,76,0.18)',
      },
      borderRadius: {
        xl2: '1.25rem',
      },
      backgroundImage: {
        'mesh-hero': 'radial-gradient(circle at 15% 20%, rgba(232,163,61,0.35), transparent 45%), radial-gradient(circle at 85% 15%, rgba(122,31,61,0.4), transparent 40%), radial-gradient(circle at 50% 100%, rgba(26,107,103,0.5), transparent 50%)',
        'grain': "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E\")",
      },
      keyframes: {
        fadeUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        floatSlow: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
        pulseSoft: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.12)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.6s cubic-bezier(0.16,1,0.3,1) both',
        'scale-in': 'scaleIn 0.4s cubic-bezier(0.16,1,0.3,1) both',
        'float-slow': 'floatSlow 6s ease-in-out infinite',
        shimmer: 'shimmer 1.6s infinite linear',
        'pulse-soft': 'pulseSoft 0.5s ease-in-out',
        marquee: 'marquee 22s linear infinite',
      },
      transitionTimingFunction: {
        'bounce-soft': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
      },
    },
  },
  plugins: [],
};
