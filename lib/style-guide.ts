import { readFileSync } from 'fs';
import path from 'path';

export interface ColorToken {
  name: string;
  value: string;
  cssVariable?: string;
  variants?: Record<string, string>;
}

export interface SpacingToken {
  name: string;
  value: string;
  pixels?: string;
}

export interface AnimationToken {
  name: string;
  value: string;
}

export interface StyleGuideData {
  colors: {
    semantic: ColorToken[];
    brand: ColorToken[];
    custom: ColorToken[];
  };
  spacing: SpacingToken[];
  animations: AnimationToken[];
  glassmorphism: {
    classes: string[];
    examples: {
      name: string;
      class: string;
      description: string;
    }[];
  };
}

export async function getStyleGuideData(): Promise<StyleGuideData> {
  // Read tailwind config
  const configPath = path.join(process.cwd(), 'tailwind.config.js');
  const configContent = readFileSync(configPath, 'utf8');
  
  // Extract colors from globals.css
  const globalsPath = path.join(process.cwd(), 'app/globals.css');
  const globalsContent = readFileSync(globalsPath, 'utf8');
  
  // Parse CSS variables from globals.css
  const cssVarRegex = /--([\w-]+):\s*([^;]+);/g;
  const cssVariables: Record<string, string> = {};
  let match;
  
  while ((match = cssVarRegex.exec(globalsContent)) !== null) {
    cssVariables[match[1]] = match[2];
  }
  
  // Parse semantic colors from tailwind config
  const semanticColors: ColorToken[] = [
    {
      name: "Primary",
      value: "#2563EB",
      cssVariable: "--primary",
      variants: {
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
      }
    },
    {
      name: "Secondary",
      value: "#F1F5F9",
      cssVariable: "--secondary",
      variants: {
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
      }
    },
    {
      name: "Success",
      value: "#10B981",
      cssVariable: "--success",
      variants: {
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
      }
    },
    {
      name: "Warning",
      value: "#F59E0B",
      cssVariable: "--warning",
      variants: {
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
      }
    },
    {
      name: "Error",
      value: "#EF4444",
      cssVariable: "--error",
      variants: {
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
      }
    },
    {
      name: "Care",
      value: "#8B5CF6",
      cssVariable: "--care",
      variants: {
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
      }
    },
    {
      name: "Trust",
      value: "#14B8A6",
      cssVariable: "--trust",
      variants: {
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
      }
    },
    {
      name: "Background",
      value: "hsl(var(--background))",
      cssVariable: "--background"
    },
    {
      name: "Foreground",
      value: "hsl(var(--foreground))",
      cssVariable: "--foreground"
    },
    {
      name: "Muted",
      value: "hsl(var(--muted))",
      cssVariable: "--muted"
    },
    {
      name: "Muted Foreground",
      value: "hsl(var(--muted-foreground))",
      cssVariable: "--muted-foreground"
    },
    {
      name: "Border",
      value: "hsl(var(--border))",
      cssVariable: "--border"
    },
    {
      name: "Input",
      value: "hsl(var(--input))",
      cssVariable: "--input"
    },
    {
      name: "Ring",
      value: "hsl(var(--ring))",
      cssVariable: "--ring"
    },
  ];

  // Brand colors from CSS variables
  const brandColors: ColorToken[] = [
    {
      name: "Surface Background",
      value: cssVariables['surface-bg'] || '#1f2937',
      cssVariable: "--surface-bg"
    },
    {
      name: "Primary Border Top",
      value: cssVariables['primary-border-top'] || '#3b82f6',
      cssVariable: "--primary-border-top"
    },
    {
      name: "Primary Border Bottom",
      value: cssVariables['primary-border-bottom'] || '#1e40af',
      cssVariable: "--primary-border-bottom"
    },
  ];

  // Standard Tailwind spacing
  const spacing: SpacingToken[] = [
    { name: "0", value: "0", pixels: "0px" },
    { name: "px", value: "1px", pixels: "1px" },
    { name: "0.5", value: "0.125rem", pixels: "2px" },
    { name: "1", value: "0.25rem", pixels: "4px" },
    { name: "2", value: "0.5rem", pixels: "8px" },
    { name: "3", value: "0.75rem", pixels: "12px" },
    { name: "4", value: "1rem", pixels: "16px" },
    { name: "5", value: "1.25rem", pixels: "20px" },
    { name: "6", value: "1.5rem", pixels: "24px" },
    { name: "8", value: "2rem", pixels: "32px" },
    { name: "10", value: "2.5rem", pixels: "40px" },
    { name: "12", value: "3rem", pixels: "48px" },
    { name: "16", value: "4rem", pixels: "64px" },
    { name: "20", value: "5rem", pixels: "80px" },
    { name: "24", value: "6rem", pixels: "96px" },
  ];

  // Animations from tailwind config and custom CSS
  const animations: AnimationToken[] = [
    { name: "accordion-down", value: "accordion-down 0.2s ease-out" },
    { name: "accordion-up", value: "accordion-up 0.2s ease-out" },
    { name: "float", value: "float 6s ease-in-out infinite" },
  ];

  // Glassmorphism patterns
  const glassmorphism = {
    classes: ["glass-card", "glass-nav", "gradient-text", "glow-button"],
    examples: [
      {
        name: "Glass Card",
        class: "glass-card",
        description: "Card with glassmorphism effect, backdrop blur, and gradient border"
      },
      {
        name: "Glass Navigation",
        class: "glass-nav",
        description: "Navigation bar with stronger backdrop blur and subtle background"
      },
      {
        name: "Gradient Text",
        class: "gradient-text",
        description: "Text with blue to purple gradient effect"
      },
      {
        name: "Glow Button",
        class: "glow-button",
        description: "Button with glow effect and hover animation"
      },
      {
        name: "Float Animation",
        class: "float-animation",
        description: "Element with floating animation effect"
      }
    ]
  };

  return {
    colors: {
      semantic: semanticColors,
      brand: brandColors,
      custom: []
    },
    spacing,
    animations,
    glassmorphism
  };
}

// Color Usage Guidelines
export const colorUsageGuide = {
  semantic: {
    primary: {
      usage: "Primary brand actions, main CTAs, focus states, active navigation",
      examples: ["Button backgrounds", "Link colors", "Active states", "Focus rings"],
      avoid: ["Error messages", "Destructive actions", "Secondary content"]
    },
    secondary: {
      usage: "Secondary brand elements, subtle backgrounds, muted content",
      examples: ["Secondary buttons", "Card backgrounds", "Sidebar content", "Subtle borders"],
      avoid: ["Primary actions", "Error states", "High emphasis content"]
    },
    success: {
      usage: "Success states, positive feedback, completed actions, valid inputs",
      examples: ["Success messages", "Checkmarks", "Valid form inputs", "Completed progress"],
      avoid: ["Error messages", "Warning states", "Neutral content"]
    },
    warning: {
      usage: "Warning states, caution alerts, important notices, attention-needed items",
      examples: ["Warning banners", "Caution icons", "Pending states", "Important notices"],
      avoid: ["Success messages", "Error states", "Neutral informational content"]
    },
    error: {
      usage: "Error states, validation failures, destructive actions, critical alerts",
      examples: ["Error messages", "Invalid form inputs", "Delete confirmations", "Critical alerts"],
      avoid: ["Success messages", "Informational content", "Primary actions"]
    },
    care: {
      usage: "Healthcare-specific accent, empathy-focused elements, care-related features",
      examples: ["Healthcare icons", "Empathy elements", "Care-focused CTAs", "Medical content"],
      avoid: ["Error states", "Warning messages", "Generic brand elements"]
    },
    trust: {
      usage: "Professional trust indicators, security elements, reliability features",
      examples: ["Security badges", "Trust indicators", "Professional content", "Reliability icons"],
      avoid: ["Error states", "Casual elements", "Entertainment features"]
    },
    muted: {
      usage: "Secondary text, placeholder content, disabled states, subtle elements",
      examples: ["Helper text", "Placeholders", "Disabled buttons", "Secondary labels"],
      avoid: ["Primary headings", "Important CTAs", "Critical information"]
    },
    neutral: {
      usage: "Grayscale colors for UI elements, backgrounds, borders, and non-semantic text",
      examples: ["Card backgrounds (neutral-50/5)", "Borders (neutral-200)", "Dividers", "Shadows"],
      avoid: ["Primary brand colors", "Semantic states (error, success, etc.)"]
    },
    "on-dark": {
      usage: "Primary text on dark backgrounds (equivalent to white)",
      examples: ["Headings on dark sections", "Button text on colored backgrounds", "Primary content"],
      avoid: ["Secondary/muted text", "Text on light backgrounds"]
    },
    "on-light": {
      usage: "Primary text on light backgrounds (equivalent to black)",
      examples: ["Text in light modals", "Content on white cards", "Dark mode disabled states"],
      avoid: ["Text on dark backgrounds", "Low contrast situations"]
    }
  },
  
  bestPractices: [
    "Always use semantic colors instead of hardcoded hex/rgb values",
    "Use color variants (50-950) for proper contrast and hierarchy",
    "Combine semantic colors with opacity for subtle effects (e.g., bg-error/10)",
    "Test color combinations for accessibility and proper contrast ratios",
    "Use muted-foreground for secondary text instead of gray-*",
    "Apply error colors consistently across form validation",
    "Use success colors for positive feedback and completed states",
    "Reserve primary colors for the most important interactive elements"
  ],
  
  forbiddenPatterns: [
    "❌ text-red-500 → ✅ text-error",
    "❌ text-green-400 → ✅ text-success", 
    "❌ text-blue-600 → ✅ text-primary",
    "❌ text-gray-400 → ✅ text-on-dark",
    "❌ bg-yellow-100 → ✅ bg-warning/10",
    "❌ border-violet-500 → ✅ border-care",
    "❌ focus:ring-blue-500 → ✅ focus:ring-primary",
    "❌ text-white → ✅ text-on-dark (for semantic usage)",
    "❌ text-black → ✅ text-on-light (for semantic usage)",
    "❌ bg-white/10 → ✅ bg-neutral-50/10",
    "❌ border-white/20 → ✅ border-neutral-50/20"
  ],
  
  examples: {
    buttons: {
      primary: "bg-primary hover:bg-primary/90 text-on-dark",
      secondary: "bg-secondary hover:bg-secondary/90 text-secondary-foreground",
      success: "bg-success hover:bg-success/90 text-on-dark",
      warning: "bg-warning hover:bg-warning/90 text-on-dark",
      error: "bg-error hover:bg-error/90 text-on-dark",
      ghost: "bg-transparent hover:bg-neutral-50/10 text-on-dark"
    },
    text: {
      primary: "text-foreground",
      secondary: "text-on-dark", 
      success: "text-success",
      warning: "text-warning",
      error: "text-error"
    },
    borders: {
      default: "border-border",
      focus: "focus:border-primary",
      success: "border-success/50",
      warning: "border-warning/50", 
      error: "border-error/50"
    },
    backgrounds: {
      card: "bg-card",
      muted: "bg-muted",
      success: "bg-success/10",
      warning: "bg-warning/10",
      error: "bg-error/10"
    }
  }
};