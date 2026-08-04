/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fffaf0",
          100: "#fff1cc",
          200: "#ffe19a",
          300: "#ffcc5c",
          400: "#f8b526",
          500: "#e99a08",
          600: "#cb7604",
          700: "#a65308",
          800: "#873f0f",
          900: "#703511",
          950: "#411904",
        },

        gold: {
          50: "#fffbea",
          100: "#fff3c4",
          200: "#ffe687",
          300: "#ffd54a",
          400: "#fbbf24",
          500: "#e5a30a",
          600: "#c47b05",
          700: "#9d5708",
          800: "#81450d",
          900: "#6e3911",
        },

        cream: {
          50: "#fffdf9",
          100: "#fbf7ef",
          200: "#f4ede3",
          300: "#e8ddcf",
          400: "#d3c1ae",
        },

        ink: {
          50: "#f7f7f8",
          100: "#ececef",
          200: "#d5d5da",
          300: "#b0b0b8",
          400: "#85858f",
          500: "#696972",
          600: "#55555d",
          700: "#45454b",
          800: "#2c2c30",
          900: "#19191c",
          950: "#0d0d0f",
        },
      },

      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],

        display: [
          "Montserrat",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif",
        ],
      },

      boxShadow: {
        soft: "0 20px 60px rgba(26, 18, 8, 0.08)",
        card: "0 12px 40px rgba(30, 22, 10, 0.08)",
        gold: "0 16px 44px rgba(233, 154, 8, 0.22)",
        dark: "0 24px 70px rgba(0, 0, 0, 0.24)",
      },

      backgroundImage: {
        "brand-gradient":
          "linear-gradient(135deg, #fbbf24 0%, #e99a08 55%, #cb7604 100%)",

        "dark-gradient":
          "linear-gradient(135deg, #0d0d0f 0%, #19191c 55%, #272014 100%)",

        "cream-gradient":
          "linear-gradient(135deg, #fffdf9 0%, #fbf7ef 55%, #f8ecd9 100%)",
      },

      borderRadius: {
        "4xl": "2rem",
        "5xl": "2.5rem",
      },

      animation: {
        "fade-up": "fadeUp 500ms ease-out both",
        float: "float 5s ease-in-out infinite",
        pulseSoft: "pulseSoft 2.2s ease-in-out infinite",
      },

      keyframes: {
        fadeUp: {
          "0%": {
            opacity: "0",
            transform: "translateY(16px)",
          },
          "100%": {
            opacity: "1",
            transform: "translateY(0)",
          },
        },

        float: {
          "0%, 100%": {
            transform: "translateY(0)",
          },
          "50%": {
            transform: "translateY(-8px)",
          },
        },

        pulseSoft: {
          "0%, 100%": {
            opacity: "1",
          },
          "50%": {
            opacity: "0.65",
          },
        },
      },
    },
  },

  plugins: [],
};