import type { Config } from "tailwindcss";
import typography from "@tailwindcss/typography";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#14313B",
        deep: "#0B3C49",
        teal: { DEFAULT: "#0E7C86", dark: "#0A5F67", light: "#E8F4F5" },
        sand: { DEFAULT: "#F6F1E7", light: "#FBF8F2", dark: "#EDE3D0" },
        coral: { DEFAULT: "#EF6349", dark: "#D8543B", light: "#FDEEEA" },
        gold: { DEFAULT: "#C6A15B", light: "#F6EFDF" },
      },
      fontFamily: {
        display: ["Fraunces", "Georgia", "serif"],
        sans: ["Figtree", "Inter", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(11,60,73,0.06), 0 8px 24px -8px rgba(11,60,73,0.14)",
        lift: "0 2px 4px rgba(11,60,73,0.08), 0 18px 44px -14px rgba(11,60,73,0.25)",
      },
      maxWidth: { shell: "76rem" },
    },
  },
  plugins: [typography],
};
export default config;
