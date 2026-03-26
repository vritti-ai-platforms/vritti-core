/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './index.ts',
    './App.tsx',
    './src/**/*.{ts,tsx}',
    './node_modules/@vritti/quantum-ui-native/src/**/*.{ts,tsx}',
  ],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        border: '#E3EFFB',
        input: '#E3EFFB',
        ring: '#1C77E3',
        background: '#FFFFFF',
        foreground: '#0A1D36',
        primary: { DEFAULT: '#1C77E3', foreground: '#FFFFFF' },
        secondary: { DEFAULT: '#F0F7FF', foreground: '#1C77E3' },
        muted: { DEFAULT: '#F5F9FD', foreground: '#5A728D' },
        accent: { DEFAULT: '#E6F0FC', foreground: '#1C77E3' },
        destructive: { DEFAULT: '#DC2626', foreground: '#FFFFFF' },
        success: { DEFAULT: '#4AA651', foreground: '#FFFFFF' },
        warning: { DEFAULT: '#D9A514', foreground: '#0A1D36' },
        info: { DEFAULT: '#00A9B3', foreground: '#FFFFFF' },
        card: { DEFAULT: '#FFFFFF', foreground: '#0A1D36' },
        popover: { DEFAULT: '#FFFFFF', foreground: '#0A1D36' },
      },
    },
  },
  plugins: [],
};
