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
          50: "#FFF8DE",
          100: "#FFF2C6",
          200: "#FFF2C6",
          300: "#FFF8DE",
          400: "#AAC4F5",
          500: "#AAC4F5",
          600: "#8CA9FF",
          700: "#8CA9FF",
          800: "#7A99FF",
          900: "#6A89FF",
        },
      },
    },
  },
  plugins: [],
};

export default config;