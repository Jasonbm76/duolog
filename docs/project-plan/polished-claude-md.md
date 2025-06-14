# CLAUDE.md - Developer Profile & Workflow Guidelines

*Complete context for Claude assistance across all projects and chat sessions*

---

## 👤 Developer Profile: Jason Murphy

Hi Claude — I'm **Jason Murphy**, a senior frontend engineer with 20+ years of experience, currently focused on building high-impact SaaS products as a solo founder under my brand **Murphy Labs**. I'm a React/TypeScript specialist with strong UX instincts and an eye for clean UI, often working from Figma designs and iterating rapidly. 

I'm transitioning into full-stack work using **Supabase**, **Next.js App Router**, and **Tailwind CSS**. I frequently prototype multiple SaaS concepts in parallel, push updates via **Vercel**, and believe in shipping fast while polishing iteratively.

### 🎯 Current Focus
Building a portfolio of SaaS products under the **Murphy Labs** umbrella, with each project serving as both a business opportunity and educational content for the developer community.

---

## 🧠 Active Projects Portfolio

### **Primary Projects**
- **[Duolog.ai](https://duolog.ai)** – AI collaboration platform where Claude + GPT-4 work together to refine prompts. Universal appeal beyond just developers. Currently in Day 3 of 3-week MVP build.
- **[CareMap.pro](https://caremap.pro)** – Senior living placement marketplace connecting families, advisors, and facilities. Real-world B2B SaaS with proven market need.

### **Future Projects**  
- **SoloBuild.dev** – Build-in-public platform and educational content teaching developers how to build SaaS products using modern AI-assisted workflows.
- **LADJ.club** – Mobile-first community platform for book recommendations (spicy romance focus).

### **Educational Integration**
All projects are documented as complete case studies for SoloBuild.dev, creating a feedback loop between building and teaching.

---

## 🛠️ Technical Stack & Preferences

### **Core Stack**
- **Frontend:** Next.js 15 (App Router), React 19, TypeScript (strict mode)
- **Styling:** Tailwind CSS + Shadcn/UI + Radix UI primitives
- **Backend:** Supabase (Auth + PostgreSQL + Edge Functions)
- **Deployment:** Vercel with GitHub integration
- **Animations:** Framer Motion for micro-interactions
- **Icons:** Lucide React (consistent across all projects)

### **Development Philosophy**
- **Pragmatic:** Ship fast, polish iteratively, validate quickly
- **Component-driven:** Reusable UI systems across projects
- **Minimal boilerplate:** Prefer established patterns and shared systems
- **Design-first:** Strong UX instincts, often work from Figma designs
- **Local-first development:** Always develop with local databases before production

### **Preferred Tools & Libraries**
- **UI Components:** Shadcn/UI for base components, custom extensions
- **State Management:** React Server Components + TanStack Query when needed  
- **Forms:** React Hook Form + Zod validation
- **Database:** Supabase with proper Row Level Security (RLS)
- **Email:** Resend for transactional emails
- **Payments:** Stripe for billing and subscriptions

---

## 🤝 How I Use Claude

### **Primary Use Cases**
- **Architectural planning** and refactoring large codebases
- **Writing documentation**, PRDs, and technical specifications  
- **Debugging** React/TypeScript/Supabase integration issues
- **Generating starter boilerplate** and smart defaults
- **Workflow automation** suggestions (n8n integration opportunities)
- **Strategic product decisions** and market positioning

### **Dual-Claude Workflow**
- **Terminal Claude (TC):** Big architectural changes, complex refactoring, system design
- **Cursor Chat (CC):** Small tasks, UI polish, component-level work, quick fixes

*When creating todo lists, use empty checkboxes and assign tasks specifically for TC vs CC.*

### **Communication Preferences**
I prefer **clarity, reuse, and automation**. Assume projects use the standard stack unless specified otherwise. Focus on practical solutions that can be implemented quickly and scale across multiple projects.

---

## 📚 Documentation & Knowledge Management

### **Living Documentation System**
- **Always ask** if documentation should be updated when we make significant changes
- **Create/maintain** a main TOC file for easy navigation if we have a living doc system
- **Suggest creating** living documentation if projects don't have it
- **Prefix docs** for alphabetical sorting and easy organization

### **Educational Content Creation**
All development work doubles as educational content for SoloBuild.dev. Document:
- **Decision rationale** and alternatives considered
- **Technical challenges** and solutions discovered  
- **Time-saving patterns** and reusable approaches
- **Lessons learned** and best practices developed

---

## ⚙️ Workflow Guidelines

### **Global Rules**
- **Never make non-requested changes** unless I specifically say "use claude magic"
- **When "claude magic" is invoked:** Get creative, suggest improvements, optimize beyond the immediate request
- **Always consider** cross-project reusability and documentation value
- **Default assumption:** Using the standard Murphy Labs tech stack

### **Task Management Approach**
- **Break down complex tasks** into TC (architectural) and CC (implementation) buckets
- **Provide clear next steps** with specific, actionable items
- **Consider automation opportunities** using n8n or similar tools
- **Think system-wide** - how does this change affect other projects?

### **Quality Standards**
- **TypeScript strict mode** for all new code
- **Component reusability** across projects when possible
- **Performance considerations** for mobile-first experiences
- **Accessibility standards** with proper ARIA labels and semantic HTML
- **Security best practices** especially for Supabase RLS and API routes

---

## 🎯 Success Metrics & Goals

### **Business Objectives**
- **Build portfolio** of profitable SaaS products under Murphy Labs
- **Create educational content** that helps other solo developers
- **Establish thought leadership** in AI-assisted development workflows
- **Generate recurring revenue** through multiple product streams

### **Technical Objectives**  
- **Maximize code reuse** across projects through shared component systems
- **Minimize maintenance overhead** through smart architectural choices
- **Optimize development velocity** with better tooling and workflows
- **Build scalable systems** that can grow with user demand

---

## 🔄 Current Context (Day 3 - Building AI Collaboration Interface)

**Active Work:** Building the chat interface for Duolog.ai where users can watch Claude and GPT-4 collaborate in real-time.

**Recent Decisions:**
- Pivoted from developer-only to universal appeal
- Implementing popcorn pricing strategy with BYOK options
- Focusing on accessible AI collaboration vs. technical complexity

**Next Priorities:**
- Complete frontend chat system with mock data
- Build backend API for Claude ↔ GPT-4 orchestration  
- Update landing page messaging for broader market appeal

---

*Let's optimize and build smarter, together. 🚀*