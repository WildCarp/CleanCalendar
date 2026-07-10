/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // DESIGN.md 色板 — 暗色主题
        'canvas': {
          DEFAULT: '#0d0d0e',
          raised: '#141416',
          overlay: '#1c1c1f',
          inverse: '#f5f5f5',
        },
        'surface': {
          DEFAULT: '#ffffff',
          muted: '#f9fafb',
          subtle: '#f3f4f6',
          hover: '#e5e7eb',
        },
        'border': {
          DEFAULT: '#e5e7eb',
          subtle: '#f3f4f6',
          strong: '#d1d5db',
        },
        'text': {
          primary: '#0d0d0e',
          secondary: '#6b7280',
          muted: '#9ca3af',
          inverse: '#ffffff',
        },
        'accent': {
          DEFAULT: '#5b6af0',
          hover: '#4a56d4',
          muted: '#eef0ff',
        },
        // 标签组颜色 palettes
        'tag-red': '#FF6B6B',
        'tag-orange': '#FF9F43',
        'tag-yellow': '#FECA57',
        'tag-green': '#2ED573',
        'tag-teal': '#1DD1A1',
        'tag-blue': '#54A0FF',
        'tag-purple': '#5F27CD',
        'tag-pink': '#FF6B81',
      },
      fontFamily: {
        sans: ['Geist', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
        mono: ['Geist Mono', 'JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '0.875rem' }],
      },
      spacing: {
        'topbar': '44px',
        'sidebar': '240px',
        'detail': '280px',
      },
      borderRadius: {
        'card': '0.75rem',
        'block': '0.5rem',
      },
      boxShadow: {
        'card': '0 0 0 1px rgba(0,0,0,0.03), 0 1px 3px rgba(0,0,0,0.06)',
        'overlay': '0 4px 24px rgba(0,0,0,0.12)',
        'sheet': '0 -4px 24px rgba(0,0,0,0.12)',
      },
      transitionTimingFunction: {
        'out-smooth': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'in-smooth': 'cubic-bezier(0.7, 0, 0.84, 0)',
      },
    },
  },
  plugins: [],
};
