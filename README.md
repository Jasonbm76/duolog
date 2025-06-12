# 🧠 PromptPair.ai

> **Two AI minds. One perfect prompt.**  
> The smartest AI prompt generator powered by Claude + GPT-4 collaboration.

PromptPair is a productivity tool that leverages the combined thinking power of Claude and GPT-4 to help users generate, refine, and perfect their prompts—whether for writing, coding, marketing, or ideation. The system enables conversational back-and-forth between models to converge on the highest-quality prompt with minimal user effort.

---

## 🚧 Project Status

This is an actively developed **private project**. It is not open source.

- Frontend: Next.js (App Router) + Tailwind CSS
- Hosting: Vercel
- Forms / Email Capture: Supabase (waitlist table)
- DNS: Cloudflare
- AI Integration: Claude + GPT-4 (OpenAI API & Anthropic API)

---

## 📁 Project Structure (WIP)

```bash
app/
  layout.tsx        # Main layout wrapper
  page.tsx          # Landing page
  components/
    Hero.tsx
    Features.tsx
    WaitlistForm.tsx
lib/
  supabase.ts       # Supabase client init
  actions.ts        # Async form actions
public/
  logo.svg
  og-image.png
