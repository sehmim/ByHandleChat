/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}', './app/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        accent: 'var(--byh-primary, #4f46e5)',
        slate: {
          970: '#0f172a',
        },
      },
      boxShadow: {
        widget: '0 15px 30px rgba(15, 23, 42, 0.08)',
        launcher: '0 4px 12px rgba(15, 23, 42, 0.18)',
        launcherHover: '0 6px 18px rgba(15, 23, 42, 0.22)',
      },
      fontFamily: {
        sans: ["'Inter'", "'SF Pro Display'", "'Segoe UI'", 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
