import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        pastel: {
          50: "#ffffff",
          100: "#ffe7b2",
          200: "#ffe7b2",
          300: "#fff4d6",
          400: "#ffedb3",
          500: "#ffe5a0",
          600: "#ffda85",
          700: "#ffc952",
          800: "#ffb833",
          900: "#ffa500",
        },
      },
    },
  },
  plugins: [],
};

export default config;