/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ['var(--font-display)', 'Unbounded', 'system-ui', 'sans-serif'],
        sans: ['var(--font-sans)', 'Inter', 'system-ui', 'sans-serif'],
      },
      colors: {
        // Dark grounds
        ink: {
          DEFAULT: '#0B0A1F',   // page
          2: '#14133A',          // cards
          3: '#1F1C4E',          // raised cards / inputs
          hair: '#2A2760',       // borders on dark
        },
        // Neon — used as light, never as flat fill on text
        neon: {
          magenta: '#FF2E93',
          cyan: '#00E6F7',
          uv: '#9B5CFF',
          gold: '#FFE147',
          mint: '#4BE6B3',
        },
        // Readable text tokens
        paper: '#F5F2FF',        // primary on dark
        mist:  '#B6B3D9',        // secondary on dark
        faint: '#7D7AB3',        // tertiary / disabled
        // Semantic
        danger: '#FF5B7A',
        warn:   '#FFB057',
        ok:     '#4BE6B3',
        // Legacy (kept so existing /admin /checkin code doesn't break during the migration)
        glow: {
          pink:   '#FF2E93',
          purple: '#9B5CFF',
          cyan:   '#00E6F7',
          yellow: '#FFE147',
        },
      },
      boxShadow: {
        // Real neon glow: tight outline + outer bloom
        'glow-magenta': '0 0 0 1px rgba(255,46,147,.7), 0 0 16px 2px rgba(255,46,147,.45), 0 0 40px 4px rgba(255,46,147,.25)',
        'glow-cyan':    '0 0 0 1px rgba(0,230,247,.7),  0 0 16px 2px rgba(0,230,247,.45),  0 0 40px 4px rgba(0,230,247,.25)',
        'glow-uv':      '0 0 0 1px rgba(155,92,255,.7), 0 0 18px 2px rgba(155,92,255,.45), 0 0 44px 4px rgba(155,92,255,.25)',
        'glow-gold':    '0 0 0 1px rgba(255,225,71,.7), 0 0 16px 2px rgba(255,225,71,.45), 0 0 40px 4px rgba(255,225,71,.25)',
        'glow-mint':    '0 0 0 1px rgba(75,230,179,.7), 0 0 16px 2px rgba(75,230,179,.45), 0 0 40px 4px rgba(75,230,179,.25)',
        'card': '0 1px 0 0 rgba(255,255,255,.04) inset, 0 30px 60px -30px rgba(0,0,0,.6)',
      },
      backgroundImage: {
        'aurora': 'radial-gradient(60% 80% at 50% 0%, rgba(155,92,255,.35) 0%, rgba(11,10,31,0) 60%), radial-gradient(50% 70% at 80% 100%, rgba(255,46,147,.22) 0%, rgba(11,10,31,0) 60%), radial-gradient(40% 60% at 10% 80%, rgba(0,230,247,.18) 0%, rgba(11,10,31,0) 60%)',
        'aurora-soft': 'radial-gradient(40% 60% at 50% 0%, rgba(155,92,255,.18) 0%, rgba(11,10,31,0) 60%)',
        'grain': "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='120' height='120'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='4'/><feColorMatrix values='0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .04 0'/></filter><rect width='100%' height='100%' filter='url(%23n)'/></svg>\")",
      },
      keyframes: {
        'pulse-glow': {
          '0%, 100%': { opacity: '1', filter: 'brightness(1)' },
          '50%':      { opacity: '.82', filter: 'brightness(1.15)' },
        },
        'drift': {
          '0%, 100%': { transform: 'translate3d(0,0,0) scale(1)' },
          '50%':      { transform: 'translate3d(2%,-1%,0) scale(1.02)' },
        },
        'rise': {
          '0%':   { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'sparkle': {
          '0%, 100%': { opacity: '0', transform: 'scale(0.6)' },
          '50%':      { opacity: '1', transform: 'scale(1)' },
        },
        'beam-sweep': {
          '0%':   { transform: 'translateY(-100%)', opacity: '0' },
          '15%':  { opacity: '1' },
          '85%':  { opacity: '1' },
          '100%': { transform: 'translateY(100%)', opacity: '0' },
        },
        'breathe': {
          '0%, 100%': { transform: 'scale(1)',   filter: 'brightness(1)' },
          '50%':      { transform: 'scale(1.05)', filter: 'brightness(1.25)' },
        },
        'count-up-glow': {
          '0%':   { opacity: '.4', filter: 'brightness(1)' },
          '55%':  { opacity: '1',  filter: 'brightness(1.4)' },
          '100%': { opacity: '1',  filter: 'brightness(1)' },
        },
        'draw-border': {
          '0%':   { 'stroke-dashoffset': '200' },
          '100%': { 'stroke-dashoffset': '0' },
        },
        'corner-pulse': {
          '0%, 100%': { transform: 'scale(1)',   opacity: '1' },
          '40%':      { transform: 'scale(1.2)', opacity: '.9' },
        },
      },
      animation: {
        'pulse-glow': 'pulse-glow 4s ease-in-out infinite',
        'drift': 'drift 18s ease-in-out infinite',
        'rise':  'rise 380ms ease-out both',
        'sparkle': 'sparkle 2.4s ease-in-out infinite',
        'beam-sweep':    'beam-sweep 1.6s linear infinite',
        'breathe':       'breathe 2.4s ease-in-out infinite',
        'count-up-glow': 'count-up-glow 360ms ease-out',
        'draw-border':   'draw-border 400ms ease-out forwards',
        'corner-pulse':  'corner-pulse 320ms ease-out',
      },
      letterSpacing: {
        display: '-0.02em',
      },
    }
  },
  plugins: []
};
