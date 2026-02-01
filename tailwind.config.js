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
        brand: {
            navy: "#0B1F3B",
            cyan: "#06B6D4",
            cyanSoft: "#22D3EE",
            blue: "#2563EB"
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
            background: "#F7FAFF", // light.bg
            foreground: "#0B1220", // light.text
            primary: {
              DEFAULT: "#0B1F3B", // light.primary
              foreground: "#FFFFFF",
            },
            secondary: {
              DEFAULT: "#06B6D4", // light.accent
              foreground: "#FFFFFF",
            },
            success: {
                DEFAULT: "#16A34A", // light.success
                foreground: "#FFFFFF"
            },
            warning: {
                DEFAULT: "#F59E0B", // light.warning
                foreground: "#FFFFFF"
            },
            danger: {
                DEFAULT: "#EF4444", // light.error
                foreground: "#FFFFFF"
            },
            focus: "#38BDF8", // light.focus
            content1: "#FFFFFF", // light.surface
            content2: "#F1F6FF", // light.surface2
            divider: "#E2E8F0", // light.border
            default: {
              DEFAULT: "#F1F6FF", // light.surface2
              500: "#64748B", // light.textMuted
            },
          },
        },
        dark: {
          colors: {
            background: "#070B14", // dark.bg
            foreground: "#E5E7EB", // dark.text
            primary: {
              DEFAULT: "#3B82F6", // dark.primary
              foreground: "#FFFFFF",
            },
            secondary: {
              DEFAULT: "#22D3EE", // dark.accent
              foreground: "#0B1220",
            },
            success: {
                DEFAULT: "#22C55E", // dark.success
                foreground: "#0B1220"
            },
            warning: {
                DEFAULT: "#FBBF24", // dark.warning
                foreground: "#0B1220"
            },
            danger: {
                DEFAULT: "#F87171", // dark.error
                foreground: "#0B1220"
            },
            focus: "#22D3EE", // dark.focus
            content1: "#0B1220", // dark.surface
            content2: "#0F1B2D", // dark.surface2 (Sidebar/Topbar)
            divider: "#1F2A3A", // dark.border
            default: {
              DEFAULT: "#0F1B2D", // dark.surface2
              500: "#94A3B8", // dark.textMuted
            },
          },
        },
      },
    }),
  ],
};
