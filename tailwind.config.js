/** @type {import('tailwindcss').Config} */
const defaultTheme = require('tailwindcss/defaultTheme');

module.exports = {
  darkMode: 'class',
  content: [
    "./index.html",
    "./*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./context/**/*.{ts,tsx}",
    "./services/**/*.{ts,tsx}",
    "./utils/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', ...defaultTheme.fontFamily.sans],
      },
      colors: {
        /* Brand palette colors (driven by --brand-color-* CSS custom properties) */
        w4f: {
          sky: 'rgb(var(--brand-color-1) / <alpha-value>)',
          steel: 'rgb(var(--brand-color-2) / <alpha-value>)',
          slate: 'rgb(var(--brand-color-3) / <alpha-value>)',
          navy: 'rgb(var(--brand-color-4) / <alpha-value>)',
          amber: 'rgb(var(--brand-accent) / <alpha-value>)',
        },
        /* Theme-aware semantic colors */
        background: {
          primary: 'rgb(var(--bg-primary) / <alpha-value>)',
          secondary: 'rgb(var(--bg-secondary) / <alpha-value>)',
          tertiary: 'rgb(var(--bg-tertiary) / <alpha-value>)',
        },
        content: {
          primary: 'rgb(var(--content-primary) / <alpha-value>)',
          secondary: 'rgb(var(--content-secondary) / <alpha-value>)',
          subtle: 'rgb(var(--content-subtle) / <alpha-value>)',
          inverted: 'rgb(var(--content-inverted) / <alpha-value>)',
        },
        border: {
          primary: 'rgb(var(--border-primary) / <alpha-value>)',
          secondary: 'rgb(var(--border-secondary) / <alpha-value>)',
        },
        accent: {
          primary: 'rgb(var(--accent-primary) / <alpha-value>)',
          'primary-hover': 'rgb(var(--accent-primary-hover) / <alpha-value>)',
          secondary: 'rgb(var(--accent-secondary) / <alpha-value>)',
          'secondary-hover': 'rgb(var(--accent-secondary-hover) / <alpha-value>)',
          tertiary: 'rgb(var(--accent-tertiary) / <alpha-value>)',
          'tertiary-hover': 'rgb(var(--accent-tertiary-hover) / <alpha-value>)',
          'tertiary-foreground': 'rgb(var(--accent-tertiary-foreground) / <alpha-value>)',
        },
        status: {
          warning: {
            background: 'rgb(var(--status-warning-background) / <alpha-value>)',
            border: 'rgb(var(--status-warning-border) / <alpha-value>)',
            foreground: 'rgb(var(--status-warning-foreground) / <alpha-value>)',
          },
          success: {
            background: 'rgb(var(--status-success-background) / <alpha-value>)',
            border: 'rgb(var(--status-success-border) / <alpha-value>)',
            foreground: 'rgb(var(--status-success-foreground) / <alpha-value>)',
          },
          danger: {
            background: 'rgb(var(--status-danger-background) / <alpha-value>)',
            border: 'rgb(var(--status-danger-border) / <alpha-value>)',
            foreground: 'rgb(var(--status-danger-foreground) / <alpha-value>)',
          },
          info: {
            background: 'rgb(var(--status-info-background) / <alpha-value>)',
            border: 'rgb(var(--status-info-border) / <alpha-value>)',
            foreground: 'rgb(var(--status-info-foreground) / <alpha-value>)',
          },
        },
        'button-foreground-on-accent': 'rgb(var(--button-foreground-on-accent) / <alpha-value>)',
      },
      borderRadius: {
        'card': '0.75rem',   /* 12px - professional card radius */
        'pill': '9999px',
      },
      boxShadow: {
        'card': '0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)',
        'card-hover': '0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)',
        'card-elevated': '0 4px 20px rgba(0,0,0,0.06)',
      },
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            '--tw-prose-body': 'rgb(var(--content-secondary))',
            '--tw-prose-headings': 'rgb(var(--content-primary))',
            '--tw-prose-bold': 'rgb(var(--content-primary))',
            '--tw-prose-invert-body': 'rgb(var(--content-secondary))',
            '--tw-prose-invert-headings': 'rgb(var(--content-primary))',
            '--tw-prose-invert-bold': 'rgb(var(--content-primary))',
            hr: {
              borderColor: 'rgb(var(--border-secondary))',
              borderTopWidth: '2px',
              marginTop: '2em',
              marginBottom: '2em',
            },
          },
        },
      }),
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
  ],
}