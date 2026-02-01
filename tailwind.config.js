const { heroui } = require("@heroui/react");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx}",
    "./src/pages/**/*.{js,ts,jsx,tsx}",
    "./src/components/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Poppins', 'ui-sans-serif', 'system-ui'],
      },
      colors: {
        // Extension for custom consistency if needed outside HeroUI components
        surface: {
          light: "#FFFFFF",
          dark: "#0B1220",
        },
        surface2: {
          light: "#F1F6FF",
          dark: "#0F1B2D",
        }
      }
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        light: {
          colors: {
            background: "#F7FAFF", // bg
            foreground: "#0B1220", // text
            primary: {
              DEFAULT: "#0B1F3B", // primary
              foreground: "#FFFFFF",
            },
            secondary: {
              DEFAULT: "#06B6D4", // accent
              foreground: "#FFFFFF",
            },
            focus: "#38BDF8", // focus
            content1: "#FFFFFF", // surface
            content2: "#F1F6FF", // surface2
            divider: "#E2E8F0", // border
            default: {
              DEFAULT: "#F1F6FF", // surface2 as default
              500: "#64748B", // textMuted
            },
          },
        },
        dark: {
          colors: {
            background: "#070B14", // bg
            foreground: "#E5E7EB", // text
            primary: {
              DEFAULT: "#3B82F6", // primary
              foreground: "#FFFFFF",
            },
            secondary: {
              DEFAULT: "#22D3EE", // accent
              foreground: "#0B1220",
            },
            focus: "#22D3EE", // focus
            content1: "#0B1220", // surface
            content2: "#0F1B2D", // surface2
            divider: "#1F2A3A", // border
            default: {
              DEFAULT: "#0F1B2D", // surface2 as default
              500: "#94A3B8", // textMuted
            },
          },
        },
      },
    }),
  ],
};


