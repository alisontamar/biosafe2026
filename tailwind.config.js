/** @type {import('tailwindcss').Config} */
const neutral = {
  50: '#F8F9FA',
  100: '#F3EEF6',
  200: '#E6DEEC',
  300: '#CBBFD5',
  400: '#7698B3', // terciario: subtítulos, hints, íconos secundarios
  500: '#6D8FAA',
  600: '#553B5E', // texto principal
  700: '#553B5E',
  800: '#402B52', // secundario: encabezados, números
  900: '#402B52',
};

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      colors: {
        brand: {
          primary: '#A280B9',
          dark: '#402B52',
          tertiary: '#7698B3',
          text: '#553B5E',
          surface: '#F8F9FA',
          link: '#7E57C2',
          tint: '#F3ECF8',
          success: '#10B981',
          warning: '#F59E0B',
          danger: '#EF4444',
        },
        slate: neutral,
        gray: neutral,
        emerald: { 50: '#ECFDF5', 100: '#D1FAE5', 200: '#A7F3D0', 400: '#10B981', 500: '#10B981', 600: '#10B981', 700: '#047857' },
        red: { 50: '#FEF2F2', 100: '#FEE2E2', 200: '#FECACA', 400: '#EF4444', 500: '#EF4444', 600: '#EF4444', 700: '#B91C1C' },
        amber: { 50: '#FFFBEB', 100: '#FEF3C7', 200: '#FDE68A', 400: '#F59E0B', 500: '#F59E0B', 600: '#F59E0B', 700: '#B45309' },
      },
      borderRadius: {
        xl: '14px',
        '2xl': '16px',
        '3xl': '24px',
      },
      boxShadow: {
        sm: '0 4px 10px rgba(64,43,82,0.05)',
        DEFAULT: '0 4px 10px rgba(64,43,82,0.05)',
        md: '0 4px 10px rgba(64,43,82,0.05)',
        lg: '0 6px 14px rgba(162,128,185,0.35)',
        xl: '0 8px 20px rgba(0,0,0,0.15)',
        '2xl': '0 8px 20px rgba(0,0,0,0.15)',
      },
    },
  },
  plugins: [],
};
