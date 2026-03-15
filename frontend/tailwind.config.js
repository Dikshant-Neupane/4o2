/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        // Primary brand colors
        'civic-blue': '#1B4FD8',
        'civic-orange': '#F97316',
        'civic-bg': '#F8F9FC',

        // Severity colors
        severity: {
          critical: '#DC2626',
          high: '#EA580C',
          medium: '#F59E0B',
          low: '#22C55E',
          info: '#3B82F6',
        },

        // Status colors
        status: {
          submitted: '#6366F1',
          'in-progress': '#F59E0B',
          'under-review': '#3B82F6',
          resolved: '#22C55E',
          rejected: '#EF4444',
          closed: '#6B7280',
        },
      },
    },
  },
  plugins: [],
};
