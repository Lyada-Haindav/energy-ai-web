/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      fontFamily: {
        display: ["'Poppins'", "sans-serif"],
        mono: ["'IBM Plex Mono'", "monospace"]
      },
      colors: {
        ink: {
          50: "#f7fafc",
          100: "#edf2f7",
          200: "#d9e2ec",
          300: "#bcccdc",
          500: "#627d98",
          700: "#334e68",
          900: "#102a43"
        },
        signal: {
          cyan: "#2dd4bf",
          amber: "#f59e0b",
          coral: "#fb7185"
        }
      },
      boxShadow: {
        panel: "0 20px 70px -30px rgba(15, 23, 42, 0.45)",
        soft: "0 14px 40px -24px rgba(15, 23, 42, 0.4)"
      },
      keyframes: {
        rise: {
          "0%": { opacity: "0", transform: "translateY(12px)" },
          "100%": { opacity: "1", transform: "translateY(0)" }
        },
        blink: {
          "0%, 100%": { opacity: "0.2" },
          "50%": { opacity: "1" }
        }
      },
      animation: {
        rise: "rise 0.45s ease-out",
        blink: "blink 1.3s ease-in-out infinite"
      }
    }
  },
  plugins: []
};
