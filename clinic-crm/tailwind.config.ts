import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "var(--bg)",
        "bg-elevated": "var(--bg-elevated)",
        "bg-soft": "var(--bg-soft)",
        ink: "var(--ink)",
        "ink-soft": "var(--ink-soft)",
        "ink-muted": "var(--ink-muted)",
        line: "var(--line)",
        "line-soft": "var(--line-soft)",
        sky: "var(--sky)",
        "sky-soft": "var(--sky-soft)",
        sage: "var(--sage)",
        "sage-soft": "var(--sage-soft)",
        beige: "var(--beige)",
        "beige-soft": "var(--beige-soft)",
        lavender: "var(--lavender)",
        "lavender-soft": "var(--lavender-soft)",
        rose: "var(--rose)",
        "rose-soft": "var(--rose-soft)",
        accent: "var(--accent)",
        "accent-soft": "var(--accent-soft)",
      },
      borderRadius: {
        sm: "10px",
        DEFAULT: "16px",
        lg: "22px",
      },
      boxShadow: {
        sm: "0 1px 2px rgba(16, 24, 52, 0.04)",
        DEFAULT: "0 2px 8px rgba(16, 24, 52, 0.05), 0 1px 2px rgba(16, 24, 52, 0.04)",
        lg: "0 12px 40px rgba(16, 24, 52, 0.10), 0 2px 8px rgba(16, 24, 52, 0.05)",
      },
      fontFamily: {
        vazir: ["Vazirmatn", "system-ui", "sans-serif"],
        estedad: ["Estedad", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};

export default config;
