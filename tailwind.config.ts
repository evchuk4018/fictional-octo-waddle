import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        primary: "#2F5D5A",
        accent: "#A7C9C5",
        background: "#E6F0EE",
        card: "#FFFFFF",
        text: {
          primary: "#1F2D2B",
          secondary: "#6B7F7C"
        },
        progress: {
          filled: "#2F5D5A",
          empty: "#D5E4E1"
        },
        status: {
          none: "#DC2626",
          partial: "#D97706",
          all: "#16A34A"
        }
      },
      borderRadius: {
        card: "16px",
        button: "12px",
        pill: "999px"
      },
      spacing: {
        screen: "16px",
        card: "16px",
        cardGap: "12px",
        section: "24px"
      },
      height: {
        button: "48px",
        input: "48px"
      }
    }
  },
  plugins: []
};

export default config;
