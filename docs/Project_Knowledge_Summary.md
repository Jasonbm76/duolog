# Duolog.ai - Project Knowledge Summary

*Complete context for Claude assistance across chat sessions*

## 🎯 Project Overview

**Product:** Duolog.ai - AI collaboration platform that makes ChatGPT and Claude work together automatically  
**Problem:** Developers waste time copy-pasting between AI tools to get better responses  
**Solution:** Automated 3-round AI collaboration with role-based conversations  
**Target Market:** Vibe coders, developers using AI heavily in their workflow  

## 🏢 Business Context

**Company:** MurphyLabs.dev (LLC owned by Jason)  
**Strategy:** Portfolio of SaaS products under one umbrella  
**Other Projects:** CareMap.pro (senior care placement), SoloBuild.dev (planned teaching platform)  
**Timeline:** 3-week MVP, launched Day 1 with landing page  
**Revenue Model:** Credit-based pricing (~$0.50 per conversation)  

## 🛠️ Technical Stack

**Frontend:**
- Next.js 15 (App Router) + React 19 + TypeScript
- Tailwind CSS + Shadcn/UI + Radix UI
- Advanced glassmorphism design (Kevin Powell technique)
- Framer Motion animations

**Backend:**
- Supabase (Auth + PostgreSQL database) - LOCAL FIRST development
- OpenAI API + Anthropic API for AI collaboration
- Resend for transactional emails
- Stripe for credit system (future)

**Development Environment:**
- Cursor IDE with dual-Claude workflow
- TC (Terminal Claude) for big architectural changes
- CC (Cursor Claude) for UI polish and small tasks
- GitHub + Vercel deployment
- Docker for local Supabase

## 🎨 Design System

**Color Palette:**
- Background: Deep charcoal (#0D1117 - GitHub Dark inspired)
- Primary: Blue-600 (#2563EB)
- Accent: Violet-500 (#8B5CF6)
- Success: Emerald-500 (#10B981)

**Key Design Elements:**
- Advanced glassmorphism cards with backdrop-blur and gradient borders
- Semantic color system (text-error, text-success, etc.)
- Professional dark theme throughout
- Mobile-first responsive design

## 📊 Current Status

**Completed (Day 1):**
- ✅ Domain purchased and configured (duolog.ai)
- ✅ Beautiful landing page generated with enhanced v0 prompt
- ✅ GitHub repo setup with professional workflow
- ✅ Vercel deployment (live at https://www.duolog.ai/)
- ✅ Twitter strategy and first tweets
- ✅ Complete documentation system in /docs folder

**In Progress:**
- 🔄 Resend email integration for early access signups
- 🔄 Local Supabase setup with proper migrations
- 🔄 Living documentation/style guide system

**Next Priority:**
1. Wire up email capture form with Resend
2. Set up local Supabase with proper schema
3. Build AI collaboration engine
4. User authentication and credit system

## 🗂️ File Structure

```
duolog/
├── app/                    # Next.js app router
├── components/             # React components (PascalCase)
│   ├── ui/                # Shadcn/UI components
│   ├── Navigation.tsx     # Site navigation
│   ├── Hero.tsx          # Hero section
│   └── Features.tsx      # Feature cards
├── docs/                  # Living documentation system
│   ├── PROJECT_ROADMAP.md
│   ├── MVP_PLANNING_SESSION.md
│   ├── TWITTER_STRATEGY.md
│   └── enhanced_v0_prompt.md
├── _design/              # Local design files (ignored by git)
├── CLAUDE.md            # Development guidelines (generalized from CareMap)
└── README.md            # Project overview and documentation
```

## 💾 Database Architecture (Planned)

**Core Tables:**
- `users` - Authentication and credit balances
- `conversations` - AI collaboration sessions
- `conversation_rounds` - Individual ChatGPT ↔ Claude exchanges
- `usage_analytics` - Admin dashboard metrics

**Key Principles:**
- Row Level Security (RLS) for data protection
- Local development first with migration files
- No destructive database operations (learned from CareMap)
- Proper environment separation

## 🐦 Social Media Strategy

**Twitter:** @MurphyLabsDev  
**Approach:** #BuildInPublic with authentic progress updates  
**Content Strategy:** Document the development process for educational content  
**Link Strategy:** Never include links in main tweets (algorithm penalty)  

**Successful Tweet Templates:**
- Progress updates with screenshots
- Problem/solution reveals
- Technical wins and learnings
- Community engagement questions

## 🎓 Educational Integration

**SoloBuild.dev Connection:**
- Document entire Duolog development as case study
- Show vibe coding workflow in action
- Create templates and patterns for other builders
- Build audience for future educational platform

**Living Documentation:**
- Auto-updating style guide from Tailwind config
- Component library with usage examples
- Decision log and architectural choices
- Twitter strategy and growth tactics

## ⚠️ Critical Guidelines

**Development Safety (from CLAUDE.md):**
- NEVER use `supabase db reset` or destructive database commands
- Always use local development with migration files
- Use semantic color classes, never hardcoded Tailwind colors
- Follow Next.js 15 patterns (await params in API routes)
- No localStorage usage (Cursor environment limitation)

**Code Quality Standards:**
- TypeScript strict mode for all files
- PascalCase for components, camelCase for utilities
- Proper error handling and loading states
- Mobile-first responsive design
- Accessibility with proper ARIA labels

## 🎯 Success Metrics

**Technical Goals:**
- Sub-10 second response times for AI collaboration
- 15%+ trial-to-paid conversion rate
- 100+ trial users in first month

**Business Goals:**
- $270K+ revenue Year 1 (conservative estimate)
- Build email list of interested developers
- Establish thought leadership in AI development tools

## 🔄 Development Workflow

**Daily Process:**
1. Document progress in living docs
2. Commit with proper conventional commit messages
3. Tweet updates to build in public
4. Use TC for architecture, CC for polish

**Quality Assurance:**
- All builds must pass before deployment
- TypeScript compilation required
- Responsive design verification
- Performance testing on mobile

## 💡 Key Insights & Decisions

**Domain Journey:** Started as PromptPair.ai → PairPrompt.ai → Duolog.ai (much better branding)  
**Design Choice:** Kevin Powell's glassmorphism technique for premium feel  
**Color Decision:** Toned down from electric blue/neon pink to professional Material Design palette  
**Architecture:** Role-based AI collaboration (Product Manager + Tech Lead pattern)  
**Marketing:** Twitter-first strategy with authentic building in public approach  

## 🚀 Vision & Next Steps

**Immediate (Week 1):** Functional email capture and local development setup  
**Short-term (Month 1):** MVP with working AI collaboration and user accounts  
**Medium-term (Month 3):** Revenue-generating product with growing user base  
**Long-term (Year 1):** Portfolio of successful products under MurphyLabs.dev  

---

*This document should be updated as major decisions are made or project direction changes. It serves as context for any Claude chat session in this project.*