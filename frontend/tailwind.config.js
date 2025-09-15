/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        background: "#ffffff",
        foreground: "#0f172a",
        primary: {
          DEFAULT: "#1e40af",
          foreground: "#ffffff",
        },
        muted: {
          DEFAULT: "#f1f5f9",
          foreground: "#64748b",
        },
        card: {
          DEFAULT: "#ffffff",
          foreground: "#0f172a",
        },
        destructive: {
          DEFAULT: "#dc2626",
          foreground: "#ffffff",
        },
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}