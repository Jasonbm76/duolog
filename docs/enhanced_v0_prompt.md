# Enhanced v0 Prompt for DuoLog.ai

Build a one-page, dark-mode landing site for an AI SaaS startup called **DuoLog.ai**. The app uses Claude and ChatGPT together to generate the best possible responses by having them collaborate and refine ideas through structured conversations.

## 🎯 Design Requirements

**Visual Style:** Premium startup aesthetic - sleek, modern, and professional
- **Background:** Deep charcoal (`#0D1117` - GitHub Dark inspired) with subtle gradient overlay
- **Primary Color:** Blue-600 (`#2563EB`) 
- **Accent Color:** Violet-500 (`#8B5CF6`)
- **Success Color:** Emerald-500 (`#10B981`)
- **Typography:** Inter or Plus Jakarta Sans
- **Glass Effects:** True frosted glass cards using Kevin Powell's advanced glassmorphism technique

### 🎨 Advanced Glassmorphism Cards

**CRITICAL: Use this exact glassmorphism implementation for all cards:**

```css
.glass-card {
  --border-width: 1px;
  border-radius: 1rem;
  position: relative;
  background: hsl(from var(--surface-bg) h s l / 0.25);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px); /* Safari support */
}

.glass-card::before {
  content: "";
  position: absolute;
  z-index: -1;
  inset: 0;
  border-radius: inherit;
  border: var(--border-width) solid transparent;
  background: linear-gradient(
    hsl(from var(--primary-border-top) h s l / 0.5), 
    hsl(from var(--primary-border-bottom) h s l / 0.3)
  ) border-box;
  mask: linear-gradient(black, black) border-box,
       linear-gradient(black, black) padding-box;
  mask-composite: subtract;
  -webkit-mask-composite: subtract;
}
```

**Tailwind Implementation:**
```typescript
// Convert to Tailwind classes where possible, but use custom CSS for the ::before pseudo-element
const glassCardClasses = `
  relative rounded-2xl
  bg-white/5 backdrop-blur-xl
  border border-transparent
  glass-border-effect
`;
```

**CSS Variables to Include:**
```css
:root {
  --surface-bg: #1f2937;
  --primary-border-top: #3b82f6;
  --primary-border-bottom: #1e40af;
}
```

## 🛠️ Technical Stack & Standards

**Core Tech:**
- Next.js 15 with App Router
- TypeScript (strict mode)
- Tailwind CSS with Shadcn/UI components
- Radix UI primitives for accessibility
- Framer Motion for animations
- Lucide React icons
- React Hook Form for email capture

**Component Architecture:**
- Use Shadcn/UI Button, Card, Input components
- Leverage Radix UI primitives for accessibility
- Custom components should extend Shadcn patterns
- Follow Radix design system principles

**CRITICAL: Follow These Patterns:**

### Hydration Safety
```typescript
// ✅ REQUIRED - Hydration-safe component pattern
const [email, setEmail] = useState('');
const [isSubmitted, setIsSubmitted] = useState(false);

// Never use dynamic values in initial useState
// Always use useEffect for client-side behavior
```

### Component Structure
```typescript
// ✅ REQUIRED - Proper component organization
interface SectionProps {
  title: string;
  description: string;
  children?: React.ReactNode;
}

const Section: React.FC<SectionProps> = ({ title, description, children }) => {
  // Component logic
};
```

### Form Handling
```typescript
// ✅ REQUIRED - Use React Hook Form with proper validation
import { useForm } from 'react-hook-form';

const EmailForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm();
  
  const onSubmit = (data: { email: string }) => {
    // Handle form submission
    console.log('Email captured:', data.email);
  };
};
```

## 📱 Layout & Content

### Navigation Bar (Fixed)
- Logo: 🧠 or 🔁 emoji + "DuoLog"
- Minimal, clean design
- Glassmorphism effect: `backdrop-blur-md bg-white/5`

### Hero Section
- **Main Headline:** "Two AI minds. One perfect response."
- **Subheading:** "Stop copy-pasting between ChatGPT and Claude. Watch them collaborate in real-time to give you the best possible answer."
- **Email Capture Form:** 
  - Placeholder: "Enter your email for early access"
  - CTA Button: "Get Early Access"
  - Validation: Required email format
  - Success state: "Thanks! We'll be in touch soon."

### Features Section (3 Columns)
**Each feature card MUST use the glassmorphism implementation above**

1. **"AI Pair Programming"**
   - Icon: `<MessageSquare>` from lucide-react
   - Description: "Watch ChatGPT and Claude refine your prompts through structured conversation"

2. **"Smarter Refinement"**
   - Icon: `<RefreshCw>` from lucide-react  
   - Description: "3-round collaboration ensures every response is thoroughly considered and optimized"

3. **"Better Results, Faster"**
   - Icon: `<Zap>` from lucide-react
   - Description: "No more manual copy-pasting. One prompt, two AI minds, perfect output"

**Card Implementation Example:**
```tsx
<div className="glass-card p-6 hover:scale-105 transition-transform duration-300">
  <div className="flex items-center gap-4 mb-4">
    <div className="p-3 rounded-lg bg-blue-500/20">
      <MessageSquare className="w-6 h-6 text-blue-400" />
    </div>
    <h3 className="text-xl font-semibold text-white">AI Pair Programming</h3>
  </div>
  <p className="text-gray-300">Watch ChatGPT and Claude refine your prompts through structured conversation</p>
</div>
```

## 🎨 Animation Requirements

**Framer Motion Patterns:**
```typescript
// ✅ REQUIRED - Proper animation setup
import { motion } from 'framer-motion';

const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" }
};

// Use on sections and cards
<motion.div {...fadeInUp}>
  {/* Content */}
</motion.div>
```

**Hover Effects:**
- Buttons: Scale and glow on hover
- Feature cards: Subtle lift and glow
- Email form: Focus states with blue glow

## 📐 Responsive Design

**Mobile-First Approach:**
- Stack all sections vertically on mobile
- Feature cards: Single column on mobile, 3 columns on desktop
- Hero text: Smaller on mobile, larger on desktop
- Email form: Full width on mobile, centered on desktop

## 🔧 Code Quality Standards

**CRITICAL Requirements:**
- All components must be TypeScript with proper interfaces
- Use semantic HTML elements (`<section>`, `<header>`, `<main>`)
- Implement proper accessibility (ARIA labels, keyboard navigation)
- No hardcoded colors - use Tailwind's color system
- Modular component structure for easy Cursor/Supabase integration

**File Structure:**
```
app/
├── page.tsx              # Main landing page
├── components/
│   ├── Navigation.tsx
│   ├── Hero.tsx
│   ├── Features.tsx
│   └── EmailForm.tsx
├── lib/
│   └── utils.ts         # Utility functions
└── globals.css          # Tailwind styles
```

**Environment Setup:**
- Must work with Next.js 15 App Router
- Ready for Supabase integration (no localStorage usage)
- Prepared for authentication system integration
- Optimized for Vercel deployment

## 🎯 Success Criteria

The final code should:
- ✅ Build without errors (`npm run build`)
- ✅ Pass TypeScript checks (`npx tsc --noEmit`)
- ✅ Be mobile responsive and accessible
- ✅ Have smooth animations and professional polish
- ✅ Include functional email capture with validation
- ✅ Be ready for immediate Cursor development workflow

**Bonus Points:**
- Subtle particle effects or animated background
- Micro-interactions on hover states
- Professional gradient overlays
- Clean, commented code structure

Generate the complete landing page with this enhanced specification, focusing on both visual appeal and technical excellence.