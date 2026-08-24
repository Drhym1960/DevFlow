import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#07070b",
          900: "#0c0c14",
          850: "#12121c",
          800: "#181826",
          700: "#222233",
          600: "#2e2e44",
        },
        gold: {
          200: "#f3e2b8",
          300: "#e8cc86",
          400: "#d4a853",
          500: "#c4922e",
        },
        mist: {
          100: "#f4f1ea",
          300: "#c8c3b8",
          500: "#8b8796",
        },
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        glow: "0 0 80px rgba(212, 168, 83, 0.12)",
        card: "0 24px 80px rgba(0,0,0,0.45)",
      },
      backgroundImage: {
        studio:
          "radial-gradient(1200px 600px at 80% -10%, rgba(212,168,83,0.16), transparent 50%), radial-gradient(900px 500px at -10% 20%, rgba(88,120,255,0.10), transparent 45%), linear-gradient(180deg, #07070b 0%, #0c0c14 100%)",
      },
    },
  },
  plugins: [],
};

export default config;
