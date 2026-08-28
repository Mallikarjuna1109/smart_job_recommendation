/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  // `dark:` fires on an explicit dark override *or* on System mode when the
  // OS itself prefers dark - matching the exact 3-state logic the CSS custom
  // properties in index.css already use. Without the media-query arm, System
  // + an OS dark preference would leave `data-theme` unset and every `dark:`
  // utility would silently never apply.
  darkMode: [
    "variant",
    ['@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) & }', ':root[data-theme="dark"] &'],
  ],
  theme: {
    extend: {
      colors: {
        canvas: "rgb(var(--color-bg) / <alpha-value>)",
        surface: "rgb(var(--color-surface) / <alpha-value>)",
        "surface-2": "rgb(var(--color-surface-2) / <alpha-value>)",
        "surface-3": "rgb(var(--color-surface-3) / <alpha-value>)",
        ink: "rgb(var(--color-ink) / <alpha-value>)",
        "ink-2": "rgb(var(--color-ink-2) / <alpha-value>)",
        "ink-3": "rgb(var(--color-ink-3) / <alpha-value>)",
        line: "rgb(var(--color-line) / <alpha-value>)",
        "line-hover": "rgb(var(--color-line-hover) / <alpha-value>)",
        edge: "rgb(var(--color-edge) / <alpha-value>)",
        ring: "rgb(var(--color-ring) / <alpha-value>)",
        accent: "rgb(var(--color-accent) / <alpha-value>)",
        "accent-2": "rgb(var(--color-accent-2) / <alpha-value>)",
        "on-accent": "rgb(var(--color-on-accent) / <alpha-value>)",
        positive: "rgb(var(--color-positive) / <alpha-value>)",
        warning: "rgb(var(--color-warning) / <alpha-value>)",
        danger: "rgb(var(--color-danger) / <alpha-value>)",
        "match-excellent": "rgb(var(--color-match-excellent) / <alpha-value>)",
        "match-strong": "rgb(var(--color-match-strong) / <alpha-value>)",
        "match-moderate": "rgb(var(--color-match-moderate) / <alpha-value>)",
        "match-weak": "rgb(var(--color-match-weak) / <alpha-value>)",
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
        display: ["Manrope", "Inter", "system-ui", "-apple-system", "Segoe UI", "sans-serif"],
      },
      keyframes: {
        "slide-in": { from: { transform: "translateX(100%)" }, to: { transform: "translateX(0)" } },
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
      },
      animation: {
        "slide-in": "slide-in 220ms ease-out",
        "fade-in": "fade-in 150ms ease-out",
      },
    },
  },
  plugins: [],
};
