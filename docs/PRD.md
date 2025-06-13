# 🧠 DuoLog.ai — Product Requirements Document (PRD)

## 1. Overview
**Product Name:** DuoLog.ai  
**Tagline:** *Two AI minds. One perfect prompt.*  
**Summary:**  
DuoLog.ai is a modern AI-powered prompt generator that combines Claude and GPT-4 in a cooperative loop to brainstorm, critique, and refine user-submitted prompts. It delivers smarter, more refined outputs by letting the two models collaborate—resulting in better prompts, faster.

---

## 2. Target Users

- Indie founders and solo SaaS builders  
- Content creators and marketers using AI tools  
- Developers and prompt-engineering enthusiasts  
- Teams looking for structured prompt refinement

---

## 3. Problem Statement

Single-model prompt generators can feel flat, generic, or incomplete. Users often have to edit or regenerate multiple times. There's no standard tool that brings two powerful LLMs together in a back-and-forth dialogue to get a *"best of both worlds"* outcome.

**DuoLog solves this** by letting Claude and GPT-4 collaborate in real time on user input, refining ideas like a pair of AI co-founders.

---

## 4. MVP Scope — Core Features

### 🔹 1. Landing Page + Waitlist
- One-page site (Next.js + Tailwind)
- Hero section with branding + CTA form
- Three feature highlight blocks
- Email capture form wired to Supabase

### 🔹 2. Prompt Engine API (`/api/prompt`)
- Input prompt submitted from frontend
- Workflow:
  1. Claude brainstorms
  2. GPT-4 refines Claude’s output
  3. Claude critiques GPT
  4. GPT returns final version
- Return final response to UI

### 🔹 3. Basic Usage Tracking
- Supabase `users` and `usage_log` tables
- Track # of prompts per user/email
- Limit free-tier usage to 3–5 prompts

### 🔹 4. Stripe Ready (Stub Only)
- Stripe initialized in dashboard
- Placeholder upgrade buttons or pricing sections
- Billing to be activated post-launch

---

## 5. Technical Stack

| Layer        | Tool / Tech             |
|--------------|--------------------------|
| Frontend     | Next.js (App Router), Tailwind CSS, Framer Motion |
| Backend/API  | Node (Edge API routes), Supabase functions |
| LLMs         | OpenAI (GPT-4 Turbo), Anthropic (Claude 3) |
| Auth         | Email-only (for now), optional OTP via Supabase |
| Hosting      | Vercel |
| DNS          | Cloudflare (post-outage resolution) |

---

## 6. Success Criteria (MVP)

- ✅ Site deployed live at `DuoLog.ai`
- ✅ Working email capture with 100+ signups
- ✅ Working prompt generation with Claude + GPT-4 loop
- ✅ Prompt usage tracked per email
- ✅ Stripe environment initialized

---

## 7. Post-MVP Goals

- Enable Stripe billing (Free / Starter / Pro tiers)
- Add account login with saved prompt history
- Build template library (marketing, dev, writing, etc.)
- Create export/share functionality
- Add analytics and success summaries
- Improve Claude/GPT logic weighting via prompt tuning

---

## 8. Stretch Features (V2+)

- Function calling & context threading
- API access for power users
- Collaboration features (share prompts with teammates)
- DuoLog “playground” mode (edit + replay model outputs)
- Claude/GPT “battles” with winner logic

---

## ✅ Next Steps

- [ ] Run final v0.dev prompt and export landing page
- [ ] Push to GitHub and deploy via Vercel
- [ ] Create waitlist table in Supabase and wire up form
- [ ] Build basic `/api/prompt` Claude-GPT workflow
- [ ] Add usage logging and free-tier limit