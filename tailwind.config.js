/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          light: '#49AFAF',
          DEFAULT: '#3f51b5',
          dark: '#303f9f',
        },
        secondary: {
          light: '#ff7043',
          DEFAULT: '#ff5722',
          dark: '#e64a19',
        },
        success: {
          light: '#66bb6a',
          DEFAULT: '#4caf50',
          dark: '#388e3c',
        },
        warning: {
          light: '#ffb74d',
          DEFAULT: '#ff9800',
          dark: '#f57c00',
        },
        danger: {
          light: '#ef5350',
          DEFAULT: '#f44336',
          dark: '#d32f2f',
        },
        info: {
          light: '#42a5f5',
          DEFAULT: '#2196f3',
          dark: '#1976d2',
        },
        background: {
          light: '#A8DFF4',
          DEFAULT: '#49AFAF',
          dark: '#303030',
        }
      },
      fontFamily: {
        sans: ['Roboto', 'sans-serif'],
        heading: ['Poppins', 'sans-serif'],
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      },
      boxShadow: {
        'card': '0 6px 12px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 10px 20px rgba(0, 0, 0, 0.12)',
      },
    },
  },
  plugins: [],
}

