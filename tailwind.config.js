/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
    "*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "#2563EB",
          50: "#EFF6FF",
          100: "#DBEAFE",
          200: "#BFDBFE",
          300: "#93C5FD",
          400: "#60A5FA",
          500: "#3B82F6",
          600: "#2563EB",
          700: "#1D4ED8",
          800: "#1E40AF",
          900: "#1E3A8A",
          950: "#172554",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "#F1F5F9",
          50: "#F8FAFC",
          100: "#F1F5F9",
          200: "#E2E8F0",
          300: "#CBD5E1",
          400: "#94A3B8",
          500: "#64748B",
          600: "#475569",
          700: "#334155",
          800: "#1E293B",
          900: "#0F172A",
          950: "#020617",
          foreground: "hsl(var(--secondary-foreground))",
        },
        // Success/Green for positive actions
        success: {
          DEFAULT: "#10B981",
          50: "#ECFDF5",
          100: "#D1FAE5",
          200: "#A7F3D0",
          300: "#6EE7B7",
          400: "#34D399",
          500: "#10B981",
          600: "#059669",
          700: "#047857",
          800: "#065F46",
          900: "#064E3B",
          950: "#022C22",
        },
        // Warning/Amber for alerts and cautions
        warning: {
          DEFAULT: "#F59E0B",
          50: "#FFFBEB",
          100: "#FEF3C7",
          200: "#FDE68A",
          300: "#FCD34D",
          400: "#FBBF24",
          500: "#F59E0B",
          600: "#D97706",
          700: "#B45309",
          800: "#92400E",
          900: "#78350F",
          950: "#451A03",
        },
        error: {
          DEFAULT: "#EF4444",
          50: "#FEF2F2",
          100: "#FEE2E2",
          200: "#FECACA",
          300: "#FCA5A5",
          400: "#F87171",
          500: "#EF4444",
          600: "#DC2626",
          700: "#B91C1C",
          800: "#991B1B",
          900: "#7F1D1D",
          950: "#450A0A",
          foreground: "hsl(var(--error-foreground))",
        },
        care: {
          DEFAULT: "#8B5CF6",
          50: "#F5F3FF",
          100: "#EDE9FE",
          200: "#DDD6FE",
          300: "#C4B5FD",
          400: "#A78BFA",
          500: "#8B5CF6",
          600: "#7C3AED",
          700: "#6D28D9",
          800: "#5B21B6",
          900: "#4C1D95",
          950: "#2E1065",
        },
        trust: {
          DEFAULT: "#14B8A6",
          50: "#F0FDFA",
          100: "#CCFBF1",
          200: "#99F6E4",
          300: "#5EEAD4",
          400: "#2DD4BF",
          500: "#14B8A6",
          600: "#0D9488",
          700: "#0F766E",
          800: "#115E59",
          900: "#134E4A",
          950: "#042F2E",
        },
        light: {
          DEFAULT: "#FFFFFF", // background in light mode
          foreground: "#0F172A", // dark slate (to match secondary.900)
        },
        dark: {
          DEFAULT: "#0F172A", // background in dark mode (deep slate)
          foreground: "#F8FAFC", // almost-white (to match secondary.50)
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Neutral color ramp (white to black)
        neutral: {
          DEFAULT: "#71717A", // Gray 500 equivalent
          50: "#FAFAFA",
          100: "#F5F5F5",
          200: "#E5E5E5",
          300: "#D4D4D4",
          400: "#A3A3A3",
          500: "#71717A",
          600: "#52525B",
          700: "#3F3F46",
          800: "#27272A",
          900: "#18181B",
          950: "#09090B",
        },
        // Pure white/black for when needed
        white: "#FFFFFF",
        black: "#000000",
        // High-level semantic colors for text visibility
        "on-dark": "#FFFFFF", // Text on dark backgrounds
        "on-light": "#000000", // Text on light backgrounds
        "on-dark-muted": "#D4D4D4", // Muted text on dark (neutral-300)
        "on-light-muted": "#52525B", // Muted text on light (neutral-600)
        
        // AI Brand Colors - Claude/Anthropic
        claude: {
          50: "#fdf4ff",   // Very light purple tint
          100: "#fae8ff",  // Light purple background
          200: "#f3d2ff",  // Soft purple
          300: "#e9b3ff",  // Light purple accent
          400: "#d280ff",  // Medium purple
          500: "#cc6633",  // Anthropic brand orange (primary)
          600: "#b85c2e",  // Darker orange
          700: "#9d4f27",  // Deep orange
          800: "#7a3e1f",  // Very dark orange
          900: "#5c2f17",  // Darkest orange
          950: "#3d1f0f",  // Almost black orange
        },
        
        // Alternative Claude Purple Theme
        claudePurple: {
          50: "#fdf4ff",
          100: "#fae8ff", 
          200: "#f3d2ff",
          300: "#e9b3ff",
          400: "#d280ff",
          500: "#b855ff",  // Primary Claude purple
          600: "#9f3fff",  // Medium purple  
          700: "#8b2fff",  // Darker purple
          800: "#6b1f99",  // Deep purple
          900: "#4c1566",  // Very dark purple
          950: "#2d0d3d",  // Darkest purple
        },
        
        // AI Brand Colors - OpenAI/ChatGPT
        openai: {
          50: "#f0fdfa",   // Very light teal tint
          100: "#ccfbf1",  // Light teal background
          200: "#99f6e4",  // Soft teal
          300: "#5eead4",  // Light teal accent
          400: "#2dd4bf",  // Medium teal
          500: "#10b981",  // OpenAI brand teal (primary)
          600: "#059669",  // Darker teal
          700: "#047857",  // Deep teal
          800: "#065f46",  // Very dark teal
          900: "#064e3b",  // Darkest teal
          950: "#042f2e",  // Almost black teal
        },
        
        // Alternative OpenAI Green Theme
        openaiGreen: {
          50: "#f0fdf4",
          100: "#dcfce7",
          200: "#bbf7d0", 
          300: "#86efac",
          400: "#4ade80",
          500: "#22c55e",  // Primary OpenAI green
          600: "#16a34a",  // Medium green
          700: "#15803d",  // Darker green
          800: "#166534",  // Deep green
          900: "#14532d",  // Very dark green
          950: "#052e16",  // Darkest green
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: 0 },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: 0 },
        },
        "breathe": {
          "0%, 100%": { 
            transform: "scale(1)",
            opacity: "0.6"
          },
          "50%": { 
            transform: "scale(1.1)",
            opacity: "0.9"
          },
        },
        "breathe-glow": {
          "0%, 100%": { 
            backgroundColor: "#3B82F6",
            transform: "scale(1)",
            opacity: "0.4",
            boxShadow: "0 0 0 0 rgba(59, 130, 246, 0.4)"
          },
          "50%": { 
            backgroundColor: "#8B5CF6",
            transform: "scale(1.15)",
            opacity: "0.8",
            boxShadow: "0 0 20px 8px rgba(139, 92, 246, 0.6)"
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "breathe": "breathe 2s ease-in-out infinite",
        "breathe-glow": "breathe-glow 1.8s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}