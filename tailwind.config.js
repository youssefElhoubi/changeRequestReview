/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "rgb(var(--color-brand-50) / <alpha-value>)",
          100: "rgb(var(--color-brand-100) / <alpha-value>)",
          500: "rgb(var(--color-brand-500) / <alpha-value>)",
          600: "rgb(var(--color-brand-600) / <alpha-value>)",
          700: "rgb(var(--color-brand-700) / <alpha-value>)",
        },
        "brand-contrast": "rgb(var(--color-brand-contrast) / <alpha-value>)",
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        muted: "rgb(var(--color-muted) / <alpha-value>)",
        canvas: "rgb(var(--color-canvas) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        line: "rgb(var(--color-line) / <alpha-value>)",
        success: {
          50: "rgb(var(--color-success-50) / <alpha-value>)",
          600: "rgb(var(--color-success-600) / <alpha-value>)",
          700: "rgb(var(--color-success-700) / <alpha-value>)",
        },
        warning: {
          50: "rgb(var(--color-warning-50) / <alpha-value>)",
          600: "rgb(var(--color-warning-600) / <alpha-value>)",
          700: "rgb(var(--color-warning-700) / <alpha-value>)",
        },
        danger: {
          50: "rgb(var(--color-danger-50) / <alpha-value>)",
          600: "rgb(var(--color-danger-600) / <alpha-value>)",
          700: "rgb(var(--color-danger-700) / <alpha-value>)",
        },
      },
      fontFamily: {
        sans: "var(--font-sans)",
      },
      fontSize: {
        "page-title": [
          "var(--text-page-title)",
          { lineHeight: "var(--text-page-title-line)" },
        ],
      },
      spacing: {
        page: "var(--space-page)",
        section: "var(--space-section)",
        "control-x": "var(--space-control-x)",
        "control-y": "var(--space-control-y)",
      },
      boxShadow: {
        surface: "var(--shadow-surface)",
        floating: "var(--shadow-floating)",
      },
      borderRadius: {
        panel: "var(--radius-panel)",
        control: "var(--radius-control)",
        pill: "var(--radius-pill)",
      },
      transitionDuration: {
        fast: "var(--duration-fast)",
        standard: "var(--duration-standard)",
        slow: "var(--duration-slow)",
      },
      transitionTimingFunction: {
        standard: "var(--ease-standard)",
      },
    },
  },
  plugins: [],
};
