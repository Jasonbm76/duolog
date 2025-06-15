import { Message, ProcessingStatus } from '@/lib/types/chat';

// Enhanced mock data structure with input prompts and processing states
interface MockAIResponse {
  content: string;
  inputPrompt: string; // What was fed to this AI
  processingStates?: ProcessingStatus[]; // Sequence of states during generation
  agreementStatus?: 'agree' | 'disagree' | 'partial'; // For dynamic collaboration
  suggestions?: string; // What to improve/change if disagreeing
}

// New dynamic collaboration structure
interface DynamicExchange {
  exchangeId: number;
  gptResponse: MockAIResponse;
  claudeReview: MockAIResponse;
  gptCounter?: MockAIResponse; // If Claude disagrees
  claudeFinal?: MockAIResponse; // Final review if needed
}

interface DynamicConversationFlow {
  userPrompt: string;
  exchanges: DynamicExchange[];
  maxExchanges: number;
  reachedAgreement: boolean;
}

// Legacy structure for backward compatibility
interface MockRound {
  round: number;
  claude: MockAIResponse;
  gpt: MockAIResponse;
}

interface MockConversationFlow {
  userPrompt: string;
  rounds: MockRound[];
}

// Processing status sequences for different AI behaviors
export const processingSequences = {
  claude: ['thinking', 'analyzing', 'generating', 'reviewing', 'complete'] as ProcessingStatus[],
  gpt: ['thinking', 'analyzing', 'generating', 'finalizing', 'complete'] as ProcessingStatus[],
  quick: ['thinking', 'generating', 'complete'] as ProcessingStatus[],
  complex: ['thinking', 'analyzing', 'generating', 'reviewing', 'finalizing', 'complete'] as ProcessingStatus[],
};

// Mock responses for different scenarios
export const mockConversationFlows: Record<string, MockConversationFlow> = {
  // Example 1: Vibe coding journey
  vibeCoding: {
    userPrompt: "I want to start a vibe coding website but have no idea how to start it",
    rounds: [
      {
        round: 1,
        claude: {
          content: "Love the vibe coder energy! 🎨 Starting from zero to building websites is totally doable. Here's your journey:\n\n**Start with the Foundation:**\n1. **HTML/CSS** - Learn to structure and style web pages\n2. **JavaScript** - Add interactivity and dynamic features\n3. **Choose your vibe** - Minimalist? Colorful? Dark mode?\n\n**Tools to Embrace:**\n- **VS Code** - Your coding sanctuary\n- **CodePen** - Play with ideas instantly\n- **Figma** - Design first, code second\n\n**Learning Path (3-6 months):**\nWeek 1-2: HTML basics, Week 3-4: CSS styling, Week 5-8: JavaScript fundamentals\n\nWhat kind of website are you dreaming of? Portfolio? Business? Creative project?",
          inputPrompt: "User wants to start a website having never coded before and become a 'vibe coder'. Provide guidance on the coding journey with an enthusiastic, creative approach.",
          processingStates: processingSequences.claude
        },
        gpt: {
          content: "Becoming a vibe coder is all about finding your creative flow! Here's the path that'll get you there:\n\n**The Vibe Coder Mindset:**\n- Code as creative expression, not just logic\n- Build things you're passionate about\n- Embrace the learning process\n\n**Your 90-Day Plan:**\n\n**Days 1-30: Foundation**\n- freeCodeCamp HTML/CSS\n- Build 3 simple pages daily\n- Follow design inspiration on Dribbble\n\n**Days 31-60: JavaScript Magic**\n- Interactive elements\n- Animations and transitions\n- Your first dynamic website\n\n**Days 61-90: Framework Fun**\n- Learn React or Vue\n- Build your dream project\n\nStart with something you care about - a hobby site, personal brand, or cause you believe in. What excites you most?",
          inputPrompt: "Building on Claude's response about becoming a vibe coder. Focus on practical steps, timeline, and the creative/passionate approach to learning web development.",
          processingStates: processingSequences.gpt
        }
      },
      {
        round: 2,
        claude: {
          content: "GPT-4 nailed the mindset! Let me add the secret sauce - **modern vibe coder tools**:\n\n**Next-Level Stack:**\n- **Tailwind CSS** - Style without leaving HTML\n- **Next.js** - React framework that just works\n- **Vercel** - Deploy in 30 seconds\n- **Supabase** - Backend without the headache\n\n**The Vibe Development Flow:**\n1. **Design in browser** - Start with Tailwind components\n2. **Component thinking** - Build reusable pieces\n3. **Ship early, iterate fast** - Don't wait for perfection\n\n**Weekly Learning Sprints:**\n- Monday: Learn something new\n- Tuesday-Thursday: Build and experiment\n- Friday: Ship what you made\n- Weekend: Explore, get inspired\n\n**Pro Tip:** Join coding communities like Frontend Mentor, Dev.to, or Twitter #buildinpublic. The vibe coder community is incredibly supportive!",
          inputPrompt: "GPT-4 provided a great 90-day plan. Build on this with modern web development tools and stack recommendations. Focus on current best practices and community aspects.",
          processingStates: processingSequences.claude
        },
        gpt: {
          content: "Claude's modern stack is perfect! Let me add the **practical vibe coding workflow**:\n\n**Your Daily Vibe Coding Ritual:**\n```\n☕ Morning: 30 mins learning (YouTube, docs)\n🎯 Focus time: 2-3 hours building\n📱 Break: Browse design inspiration\n🚀 Evening: Ship something small\n```\n\n**Essential Resources:**\n- **YouTube**: Kevin Powell (CSS), Net Ninja (JS)\n- **Practice**: Frontend Mentor challenges\n- **Inspiration**: Awwwards, Dribbble, CodePen\n- **Community**: Discord servers, Reddit r/webdev\n\n**The Magic Formula:**\n1. **Copy before creating** - Recreate sites you love\n2. **Share your progress** - Document your journey\n3. **Build with purpose** - Solve real problems\n\n**First Project Ideas:**\n- Personal portfolio with your personality\n- Landing page for a local business\n- Tool that solves your own problem\n\nRemember: Every expert was once a beginner. Start messy, ship often, vibe always! 🎨✨",
          inputPrompt: "Claude mentioned great modern tools (Tailwind, Next.js, Vercel, Supabase). Complement this with daily workflow, learning resources, and actionable project ideas.",
          processingStates: processingSequences.gpt
        }
      },
      {
        round: 3,
        claude: {
          content: "Perfect roadmap! Let me wrap this up with your **Vibe Coder Graduation Plan**:\n\n**Month 1-2: Foundation Vibes**\n- Master HTML/CSS fundamentals\n- Build 10 small projects\n- Learn design principles\n- Set up your development environment\n\n**Month 3-4: JavaScript Journey**\n- Interactive web components\n- API integration basics\n- Version control with Git\n- Deploy your first dynamic site\n\n**Month 5-6: Framework Flow**\n- Choose React, Vue, or Svelte\n- Build a full project with backend\n- Learn deployment and hosting\n- Create your developer portfolio\n\n**Your Vibe Coder Toolkit:**\n- Code editor that sparks joy\n- Design system that reflects your style\n- Deployment workflow that's frictionless\n- Community connections that inspire\n\n**Success Metrics:**\nNot lines of code, but problems solved and joy created. You're ready to vibe! 🎨",
          inputPrompt: "GPT-4 outlined daily rituals and practical workflow. Provide a comprehensive 6-month graduation timeline with clear milestones and success metrics.",
          processingStates: processingSequences.complex
        },
        gpt: {
          content: "Amazing foundation, Claude! Here's your **final vibe coder activation**:\n\n**The 6-Month Timeline to Website Mastery:**\n\n**Beginner → Creator (Months 1-2)**\n✓ Build static websites with personality\n✓ Master responsive design\n✓ Create your first 'wow' animation\n\n**Creator → Builder (Months 3-4)**\n✓ Add interactivity and user feedback\n✓ Connect to APIs and databases\n✓ Deploy and share your work\n\n**Builder → Vibe Coder (Months 5-6)**\n✓ Framework mastery (React/Vue/Svelte)\n✓ Full-stack development\n✓ Launch your signature project\n\n**Graduation Project Ideas:**\n- Custom portfolio with your unique style\n- Web app that solves a real problem\n- Interactive experience that tells your story\n\n**Remember:** You're not just learning to code - you're learning to create digital experiences that reflect your vision. Stay curious, build with passion, and trust the process. Welcome to the vibe coder community! 🚀✨",
          inputPrompt: "Claude provided a 6-month graduation plan with milestones. Synthesize everything into a final actionable framework with specific project recommendations and motivational conclusion.",
          processingStates: processingSequences.complex
        }
      }
    ]
  },
  
  // Example 2: Writing assistance
  writingAssistance: {
    userPrompt: "Help me write a compelling email to potential customers about our new product launch.",
    rounds: [
      {
        round: 1,
        claude: {
          content: "I'd be happy to help you craft a compelling product launch email. To create the most effective message, I need a few more details:\n\n1. What type of product are you launching?\n2. Who is your target audience?\n3. What's the key benefit or unique selling point?\n4. What action do you want recipients to take?\n\nWith these details, I can help you structure an email that captures attention and drives engagement.",
          inputPrompt: "User needs help writing a compelling product launch email. Gather more information about their specific product, audience, and goals before providing guidance.",
          processingStates: processingSequences.quick
        },
        gpt: {
          content: "Great idea to reach out to potential customers! For a compelling product launch email, consider this structure:\n\n**Subject Line**: Create urgency or curiosity\n**Opening**: Personal connection or pain point\n**Product Introduction**: Brief, benefit-focused\n**Social Proof**: Testimonials or early results\n**Clear CTA**: Specific next step\n\nWhat's your product and target audience? I can help customize this framework for maximum impact.",
          inputPrompt: "User wants help with product launch email. Provide a proven email structure framework while also asking for specifics to customize the approach.",
          processingStates: processingSequences.gpt
        }
      },
      {
        round: 2,
        claude: {
          content: "Excellent framework from GPT-4! Let me build on that with specific copywriting techniques:\n\n**Subject Line Formulas**:\n- \"[Product] is here - [specific benefit]\"\n- \"The [problem] solution you've been waiting for\"\n\n**Email Structure**:\n1. Hook with a relatable problem (15-20 words)\n2. Introduce solution with emotional appeal\n3. Use \"imagine\" or \"picture this\" for visualization\n4. Include one powerful statistic or testimonial\n5. Single, action-oriented CTA button\n\n**Tone**: Conversational, confident, but not pushy. What industry are you in? This affects the language style significantly.",
          inputPrompt: "GPT-4 provided a solid email structure framework. Enhance this with specific copywriting techniques, subject line formulas, and detailed structural elements.",
          processingStates: processingSequences.claude
        },
        gpt: {
          content: "Building on Claude's excellent structure, here are proven conversion tactics:\n\n**Psychology Elements**:\n- Scarcity: \"Limited early access\" or \"First 100 customers\"\n- Social proof: \"Join 500+ beta users who've already...\"\n- Loss aversion: \"Don't miss out on...\"\n\n**Format Tips**:\n- Keep paragraphs 1-2 lines max\n- Use bullet points for features/benefits\n- Include a P.S. line (high read rate)\n- Mobile-first design (60%+ will read on mobile)\n\nShall we draft a specific version based on your product details?",
          inputPrompt: "Claude added specific copywriting techniques and formulas. Build on this with psychological principles, formatting best practices, and mobile optimization considerations.",
          processingStates: processingSequences.gpt
        }
      },
      {
        round: 3,
        claude: {
          content: "Perfect collaboration! Let me synthesize our insights into an actionable template:\n\n**Ultimate Product Launch Email Template**:\n\n*Subject*: [Specific Benefit] + [Urgency/Curiosity]\n\n*Body*:\n- Problem hook (1 sentence)\n- Solution introduction with emotional appeal\n- \"Imagine...\" visualization\n- One powerful proof point\n- Clear benefit bullets (3 max)\n- Single CTA button\n- P.S. with urgency or bonus\n\n**Next Steps**: \n1. Define your specific product/audience\n2. Choose your strongest proof point\n3. Test 2-3 subject lines\n4. A/B test with small segment first\n\nThis framework combines both our strengths - structure + psychology + practical implementation.",
          inputPrompt: "GPT-4 provided psychology principles and formatting tips. Synthesize all previous insights into a complete, actionable email template with specific implementation steps.",
          processingStates: processingSequences.complex
        },
        gpt: {
          content: "Excellent synthesis, Claude! I'll add the final optimization layer:\n\n**Pre-Send Checklist**:\n✓ Subject line under 50 characters\n✓ Preview text optimized (first 90 characters)\n✓ Single, prominent CTA button\n✓ Mobile responsive design\n✓ Unsubscribe link included\n✓ Sender name recognizable\n\n**Success Metrics to Track**:\n- Open rate (aim for 20-25%)\n- Click-through rate (aim for 3-5%)\n- Conversion rate (varies by industry)\n\n**Pro Tip**: Send Tuesday-Thursday, 10-11 AM for highest engagement.\n\nYou now have a complete, battle-tested framework that combines strategic thinking with tactical execution!",
          inputPrompt: "Claude created a comprehensive email template with implementation steps. Add the final optimization layer with pre-send checklist, success metrics, and timing recommendations.",
          processingStates: processingSequences.complex
        }
      }
    ]
  },

  // Example 3: Technical problem solving
  technicalProblem: {
    userPrompt: "I'm building a React app and getting memory leaks. How can I identify and fix them?",
    rounds: [
      {
        round: 1,
        claude: {
          content: "Memory leaks in React apps are common but fixable! Let's start with identification:\n\n**Detection Tools**:\n1. Chrome DevTools Memory tab\n2. React DevTools Profiler\n3. Performance.measureUserAgentSpecificMemory() API\n\n**Common Leak Sources**:\n- Event listeners not cleaned up\n- Intervals/timeouts not cleared\n- Subscriptions (WebSocket, API) not cancelled\n- Closures holding references\n- Third-party library integrations\n\nWhat symptoms are you seeing? Browser crashes, slow performance, or specific error messages?",
          inputPrompt: "User has memory leaks in React app. Provide identification strategies, detection tools, and common leak sources. Ask for specific symptoms to help diagnose.",
          processingStates: processingSequences.claude
        },
        gpt: {
          content: "Great question! Memory leaks in React are usually preventable with proper cleanup. Here's my diagnostic approach:\n\n**Quick Identification**:\n```javascript\n// Add to useEffect for monitoring\nuseEffect(() => {\n  const checkMemory = () => {\n    console.log('Memory usage:', performance.memory?.usedJSHeapSize);\n  };\n  const interval = setInterval(checkMemory, 5000);\n  return () => clearInterval(interval);\n}, []);\n```\n\n**Most Common Culprits**:\n1. useEffect without cleanup\n2. Event listeners on window/document\n3. Subscriptions not unsubscribed\n4. State updates after unmount\n\nWhich components or features are you suspecting?",
          inputPrompt: "Claude provided detection tools and common leak sources. Add practical code examples for monitoring memory usage and identify the most common React-specific leak patterns.",
          processingStates: processingSequences.gpt
        }
      },
      {
        round: 2,
        claude: {
          content: "Excellent monitoring approach, GPT-4! Let me add specific cleanup patterns:\n\n**The Ultimate Cleanup Hook**:\n```javascript\nfunction useCleanup() {\n  const cleanupFunctions = useRef([]);\n  \n  const addCleanup = useCallback((fn) => {\n    cleanupFunctions.current.push(fn);\n  }, []);\n  \n  useEffect(() => {\n    return () => {\n      cleanupFunctions.current.forEach(fn => fn());\n    };\n  }, []);\n  \n  return addCleanup;\n}\n```\n\n**Event Listener Pattern**:\n```javascript\nuseEffect(() => {\n  const handleResize = () => setSize(window.innerWidth);\n  window.addEventListener('resize', handleResize);\n  return () => window.removeEventListener('resize', handleResize);\n}, []);\n```\n\nAre you using any specific libraries like Socket.io, Firebase, or state management tools?",
          inputPrompt: "GPT-4 showed memory monitoring code and common culprits. Build on this with reusable cleanup patterns, specific code examples, and ask about third-party libraries.",
          processingStates: processingSequences.claude
        },
        gpt: {
          content: "Love that cleanup hook pattern, Claude! Let me add automated leak detection:\n\n**Leak Detection Hook**:\n```javascript\nfunction useLeakDetection(componentName) {\n  useEffect(() => {\n    const startMemory = performance.memory?.usedJSHeapSize;\n    \n    return () => {\n      setTimeout(() => {\n        const endMemory = performance.memory?.usedJSHeapSize;\n        const leak = endMemory - startMemory;\n        if (leak > 1000000) { // 1MB threshold\n          console.warn(`Potential leak in ${componentName}: ${leak} bytes`);\n        }\n      }, 100);\n    };\n  }, [componentName]);\n}\n```\n\n**AbortController for API Calls**:\n```javascript\nuseEffect(() => {\n  const controller = new AbortController();\n  fetch('/api/data', { signal: controller.signal })\n    .then(setData)\n    .catch(err => {\n      if (err.name !== 'AbortError') console.error(err);\n    });\n  return () => controller.abort();\n}, []);\n```",
          inputPrompt: "Claude provided excellent cleanup patterns and examples. Add automated leak detection capabilities and modern patterns like AbortController for API calls.",
          processingStates: processingSequences.gpt
        }
      },
      {
        round: 3,
        claude: {
          content: "Outstanding automated detection, GPT-4! Let me complete the picture with production-ready solutions:\n\n**Production Memory Monitoring**:\n```javascript\n// Custom hook for production monitoring\nfunction useMemoryMonitor() {\n  useEffect(() => {\n    if (process.env.NODE_ENV !== 'production') return;\n    \n    const observer = new PerformanceObserver((list) => {\n      list.getEntries().forEach((entry) => {\n        if (entry.name === 'measure') {\n          // Send to analytics\n          analytics.track('memory_usage', {\n            component: entry.detail?.componentName,\n            duration: entry.duration,\n            memory: performance.memory?.usedJSHeapSize\n          });\n        }\n      });\n    });\n    \n    observer.observe({ entryTypes: ['measure'] });\n    return () => observer.disconnect();\n  }, []);\n}\n```\n\n**Testing Strategy**:\n1. Use React Testing Library with memory assertions\n2. Set up memory thresholds in CI/CD\n3. Regular heap snapshots in staging\n\nYou now have detection, prevention, monitoring, and testing covered!",
          inputPrompt: "GPT-4 added automated leak detection and AbortController patterns. Complete the solution with production monitoring, analytics integration, and testing strategies.",
          processingStates: processingSequences.complex
        },
        gpt: {
          content: "Perfect comprehensive approach! Final piece - **Development Workflow Integration**:\n\n**ESLint Rules**:\n```json\n{\n  \"rules\": {\n    \"react-hooks/exhaustive-deps\": \"error\",\n    \"@typescript-eslint/no-floating-promises\": \"error\"\n  }\n}\n```\n\n**Memory Budget in package.json**:\n```json\n{\n  \"bundlesize\": [\n    {\n      \"path\": \"./build/static/js/*.js\",\n      \"maxSize\": \"250kb\"\n    }\n  ]\n}\n```\n\n**DevTools Extension**:\nInstall \"React Developer Tools\" + \"Memory\" tab workflow:\n1. Take heap snapshot before testing\n2. Interact with your app\n3. Force garbage collection\n4. Take another snapshot\n5. Compare for retained objects\n\n**Result**: You now have a complete memory leak prevention, detection, and monitoring system! 🎯",
          inputPrompt: "Claude provided production monitoring and testing strategies. Add development workflow integration with ESLint rules, memory budgets, and DevTools workflow for complete coverage.",
          processingStates: processingSequences.complex
        }
      }
    ]
  },

  // Example 2: Civil War Study Guide
  civilWarStudy: {
    userPrompt: "I have an exam on the American Civil War tomorrow. What are the key events, causes, and outcomes I should focus on studying?",
    rounds: [
      {
        round: 1,
        gpt: {
          content: "Great timing for your exam prep! Let me break down the Civil War into digestible sections:\n\n**Key Causes (Remember: SETS)**\n• **S**lavery - Central moral and economic divide\n• **E**conomic differences - Industrial North vs Agricultural South\n• **T**ariffs - Protective tariffs favored North, hurt South\n• **S**tates' rights - Federal power vs state autonomy\n\n**Critical Timeline**:\n📅 1860: Lincoln elected (South sees threat)\n📅 1861: Fort Sumter attacked (war begins)\n📅 1863: Gettysburg & Emancipation Proclamation (turning points)\n📅 1865: Lee surrenders at Appomattox\n\n**Must-Know Battles**: Bull Run, Antietam, Gettysburg, Vicksburg\n\nWhat specific areas does your professor emphasize most?",
          inputPrompt: "Student needs Civil War exam help. Provide structured study guide with key causes, timeline, and battles. Use memory aids and ask about professor's focus.",
          processingStates: processingSequences.gpt
        },
        claude: {
          content: "Excellent framework from GPT-4! Let me add key figures and outcomes:\n\n**Essential People to Know**:\n🎩 **Union**: Lincoln, Grant, Sherman, Douglas\n⚔️ **Confederate**: Davis, Lee, Jackson, Stephens\n\n**Major Outcomes**:\n1. **13th Amendment** - Abolished slavery\n2. **14th Amendment** - Birthright citizenship\n3. **15th Amendment** - Voting rights regardless of race\n4. **Reconstruction Era** begins (1865-1877)\n\n**Quick Memory Tricks**:\n• \"ABCD\" = Antietam, Bull Run, Chancellorsville, D-Day (wait, wrong war! Just ABC!)\n• Grant \"granted\" victory to the Union\n• Sherman's \"March to the Sea\" = Total war strategy\n\nAre you expected to know specific quotes or primary sources?",
          inputPrompt: "GPT-4 provided causes and timeline. Add key figures, constitutional amendments, outcomes, and memory tricks. Ask about primary sources.",
          processingStates: processingSequences.claude
        }
      },
      {
        round: 2,
        gpt: {
          content: "Building on Claude's excellent additions! Here's your power-study strategy:\n\n**Essay Answer Framework** (if applicable):\n• **Intro**: State thesis about Civil War's inevitability/impact\n• **Body 1**: Economic/social causes (use SETS)\n• **Body 2**: Key turning points (Gettysburg, Emancipation)\n• **Body 3**: Long-term impacts (Amendments, Reconstruction)\n• **Conclusion**: Legacy in modern America\n\n**Last-Minute Study Tips**:\n📝 Make flashcards for dates/battles\n🗣️ Explain causes out loud (teaching = learning)\n✏️ Practice writing key names (spelling counts!)\n🎯 Focus on cause-and-effect chains\n\nDo you have any practice questions from class?",
          inputPrompt: "Claude added people, outcomes, and memory tricks. Provide essay framework, last-minute study strategies, and ask about practice materials.",
          processingStates: processingSequences.gpt
        },
        claude: {
          content: "Perfect study plan! Let me give you the final exam-crushing summary:\n\n**The One-Page Cheat Sheet**:\n```\nCAUSES → CONFLICT → CONSEQUENCES\n   ↓          ↓            ↓\n SETS    4 years war   3 Amendments\n         600,000 dead   Reconstruction\n         Union preserved New America\n```\n\n**If You Remember Nothing Else**:\n1. **Why**: Slavery + states' rights = inevitable conflict\n2. **When**: 1861-1865\n3. **Who Won**: Union (North)\n4. **What Changed**: Slavery ended, federal power increased\n5. **Impact**: Defined modern American federalism\n\n**Tonight's Schedule**:\n• 30 min: Review this guide\n• 20 min: Make flashcards\n• 10 min: Quick self-quiz\n• Good night's sleep!\n\nYou've got this! 🎓",
          inputPrompt: "GPT-4 provided essay framework and study tips. Create final one-page summary, key takeaways, and tonight's study schedule.",
          processingStates: processingSequences.complex
        }
      },
      {
        round: 3,
        gpt: {
          content: "I agree with Claude's comprehensive study guide! This covers everything you need for tomorrow's exam. The combination of:\n\n• Structured causes (SETS framework)\n• Timeline with key dates\n• Important figures from both sides\n• Constitutional amendments\n• Memory aids and tricks\n• Essay structure template\n• One-page summary\n• Tonight's study plan\n\n...gives you multiple ways to approach any question format your professor might use.\n\n**Final tip**: If you get stuck on the exam, remember the story arc: A nation divided over fundamental issues → bloody conflict → reunification with new principles. Every question relates back to this narrative.\n\nGood luck tomorrow - you're well-prepared! 📚✨",
          inputPrompt: "Review the complete study guide and confirm it's comprehensive. Provide final encouragement and a backup strategy for the exam.",
          processingStates: processingSequences.quick
        },
        claude: {
          content: "Study guide complete and exam-ready!",
          inputPrompt: "Acknowledge completion",
          processingStates: processingSequences.quick
        }
      }
    ]
  },

  // Example 3: Pizza Dough Recipe
  pizzaDough: {
    userPrompt: "How do I make the perfect homemade pizza dough? I want it crispy on the outside but chewy inside.",
    rounds: [
      {
        round: 1,
        gpt: {
          content: "Ah, the quest for perfect pizza dough! Here's my tried-and-true recipe:\n\n**The Golden Ratio** (makes 2 pizzas):\n• 500g bread flour (high protein = chewy texture)\n• 325ml warm water (65% hydration)\n• 10g salt\n• 7g instant yeast\n• 2 tbsp olive oil\n\n**Method**:\n1. Mix water, yeast, and a pinch of sugar. Wait 5 min until foamy\n2. Combine flour and salt in large bowl\n3. Add water mixture and oil\n4. Mix until shaggy, then knead 10 minutes\n5. Rise 1-2 hours until doubled\n6. Punch down, divide, shape\n7. Cold ferment 24-72 hours (secret to flavor!)\n\nWhat kind of oven are you using? This affects the technique!",
          inputPrompt: "User wants perfect pizza dough recipe for crispy outside, chewy inside. Provide detailed recipe with ratios, emphasize cold fermentation, ask about oven type.",
          processingStates: processingSequences.gpt
        },
        claude: {
          content: "Excellent foundation from GPT-4! Let me add the pro techniques for that perfect texture:\n\n**Achieving Crispy-Chewy Perfection**:\n\n🔥 **High Heat is KEY**:\n• Home oven: Max temp (usually 550°F)\n• Pizza stone: Preheat 45 minutes\n• Cast iron: Preheat upside-down as makeshift stone\n\n**Texture Secrets**:\n1. **Autolyse**: After mixing, let dough rest 30 min before kneading\n2. **Window pane test**: Stretch dough thin - should be translucent\n3. **Oil the container**: Prevents sticking during rise\n4. **Don't oversauce**: Wet pizza = soggy bottom\n\n**Shaping Tip**: Leave a thick edge! Push from center outward, never rolling pin.\n\nDo you have a pizza stone or steel? Game changer for crispiness!",
          inputPrompt: "GPT-4 provided recipe and ratios. Add techniques for texture, heat management, shaping tips, and equipment recommendations.",
          processingStates: processingSequences.claude
        }
      },
      {
        round: 2,
        gpt: {
          content: "Building on Claude's technique tips - let's troubleshoot common issues:\n\n**Troubleshooting Guide**:\n😟 **Too tough**: Over-kneaded or too much flour\n😢 **Won't stretch**: Under-proofed or cold dough\n😭 **Tears easily**: Over-proofed or rough handling\n🙁 **Bland flavor**: Skip cold ferment or not enough salt\n\n**My Secret Weapons**:\n• Add 2 tbsp milk powder (extra browning)\n• Replace 10% flour with semolina (crunch!)\n• Brush crust with garlic butter before baking\n• Finish with flaky salt\n\n**No pizza stone? Hack it**:\nPreheat a baking sheet upside-down. Not perfect but works!\n\nWhat toppings are you planning? This affects moisture management!",
          inputPrompt: "Claude added techniques and equipment tips. Provide troubleshooting guide, secret ingredients, hacks for home cooks, ask about toppings.",
          processingStates: processingSequences.gpt
        },
        claude: {
          content: "Perfect troubleshooting! Here's your complete game plan:\n\n**The Timeline** (for pizza night):\n\n**3 days before**: Make dough, refrigerate\n**Day of**:\n• 2 hours before: Remove from fridge\n• 1 hour before: Preheat oven/stone to MAX\n• 30 min before: Shape doughs\n• 10 min before: Prep toppings\n\n**Assembly Order** (prevents sogginess):\n1. Olive oil base (moisture barrier)\n2. Light sauce layer\n3. Cheese (protects toppings)\n4. Toppings\n5. Drizzle of oil on crust edge\n\n**The Moment of Truth**:\n• Slide onto stone quickly\n• Bake 8-12 minutes\n• Look for: Leopard spots, golden crust, bubbling cheese\n• Rest 2 minutes before cutting\n\nYou're ready for pizzeria-quality results! 🍕",
          inputPrompt: "GPT-4 provided troubleshooting and hacks. Create complete timeline, assembly guide, and baking instructions for perfect execution.",
          processingStates: processingSequences.complex
        }
      },
      {
        round: 3,
        gpt: {
          content: "I'm fully on board with this comprehensive pizza guide! Between both our contributions, you now have:\n\n✅ Perfect dough recipe with exact ratios\n✅ Cold fermentation for complex flavors\n✅ Texture techniques (autolyse, window pane test)\n✅ Equipment recommendations and hacks\n✅ Complete troubleshooting guide\n✅ Timeline for planning\n✅ Assembly and baking instructions\n\n**One final pro tip**: Save a bit of dough to test your oven's hot spots. Bake a mini pizza first to dial in the perfect position and timing.\n\nThis method will absolutely give you that crispy-outside, chewy-inside texture you're after. Your homemade pizzas are going to be incredible! 🍕✨",
          inputPrompt: "Review the complete pizza guide and confirm it addresses the crispy-chewy texture goal. Add final pro tip.",
          processingStates: processingSequences.quick
        },
        claude: {
          content: "Pizza perfection achieved! Happy baking!",
          inputPrompt: "Acknowledge completion",
          processingStates: processingSequences.quick
        }
      }
    ]
  }
};

// Helper function to simulate streaming delays
export const getStreamingDelay = (messageLength: number): number => {
  // Simulate realistic typing speed (approximately 40-60 words per minute)
  const wordsPerMinute = 50;
  const avgCharsPerWord = 5;
  const charsPerSecond = (wordsPerMinute * avgCharsPerWord) / 60;
  return Math.max(1000, (messageLength / charsPerSecond) * 1000);
};

// Helper function to get processing delay for each status
export const getProcessingDelay = (status: ProcessingStatus): number => {
  const delays = {
    thinking: 800,
    analyzing: 1200,
    generating: 2000,
    reviewing: 1000,
    finalizing: 800,
    complete: 0,
    error: 0,
  };
  return delays[status] || 1000;
};

// Helper function to get dynamic status text
export const getStatusText = (aiModel: 'claude' | 'gpt', status: ProcessingStatus): string => {
  const statusTexts = {
    claude: {
      thinking: 'Claude is thinking...',
      analyzing: 'Claude is analyzing your request...',
      generating: 'Claude is crafting a response...',
      reviewing: 'Claude is reviewing the response...',
      finalizing: 'Claude is finalizing thoughts...',
      complete: '',
      error: 'Claude encountered an issue...',
    },
    gpt: {
      thinking: 'GPT-4 is thinking...',
      analyzing: 'GPT-4 is analyzing the conversation...',
      generating: 'GPT-4 is generating insights...',
      reviewing: 'GPT-4 is reviewing the response...',
      finalizing: 'GPT-4 is finalizing the answer...',
      complete: '',
      error: 'GPT-4 encountered an issue...',
    },
  };
  
  return statusTexts[aiModel][status] || `${aiModel} is processing...`;
};

// Helper function to convert mock response to Message format
export const createMessageFromMockResponse = (
  mockResponse: MockAIResponse,
  role: 'claude' | 'gpt',
  round: number,
  messageId?: string
): Message => ({
  id: messageId || `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
  role,
  content: mockResponse.content,
  inputPrompt: mockResponse.inputPrompt,
  timestamp: new Date(),
  round,
  processingStatus: 'complete',
});

// Mock function to get conversation flow based on initial prompt
export const getMockConversationFlow = (initialPrompt: string) => {
  const prompt = initialPrompt.toLowerCase();
  
  if (prompt.includes('vibe coder') || prompt.includes('website') || prompt.includes('never coded') || prompt.includes('coding')) {
    return mockConversationFlows.vibeCoding;
  } else if (prompt.includes('email') || prompt.includes('write') || prompt.includes('copy')) {
    return mockConversationFlows.writingAssistance;
  } else if (prompt.includes('react') || prompt.includes('memory') || prompt.includes('bug') || prompt.includes('error')) {
    return mockConversationFlows.technicalProblem;
  } else if (prompt.includes('civil war') || prompt.includes('exam') || prompt.includes('history') || prompt.includes('studying')) {
    return mockConversationFlows.civilWarStudy;
  } else if (prompt.includes('pizza') || prompt.includes('dough') || prompt.includes('crispy') || prompt.includes('chewy')) {
    return mockConversationFlows.pizzaDough;
  }
  
  // Default generic response
  return {
    userPrompt: initialPrompt,
    rounds: [
      {
        round: 1,
        claude: {
          content: "I understand you'd like help with this topic. Let me analyze your request and provide some initial thoughts and questions to better understand your specific needs.",
          inputPrompt: "User needs help with a technical topic. Provide initial thoughts and questions to better understand the specific needs.",
          processingStates: processingSequences.claude
        },
        gpt: {
          content: "Great question! I'll work with Claude to provide you with comprehensive insights. Let me start by breaking down the key aspects of your request.",
          inputPrompt: "User wants help with a technical topic. Provide initial thoughts and questions to better understand the specific needs.",
          processingStates: processingSequences.gpt
        }
      },
      {
        round: 2,
        claude: {
          content: "Building on GPT-4's analysis, I'd like to add some additional perspectives and dive deeper into the practical implications of your question.",
          inputPrompt: "Claude wants to add additional perspectives and dive deeper into the practical implications of the question.",
          processingStates: processingSequences.claude
        },
        gpt: {
          content: "Excellent insights from Claude! Let me complement that with some specific strategies and actionable steps you can take.",
          inputPrompt: "Claude provided excellent insights. Provide specific strategies and actionable steps to address the question.",
          processingStates: processingSequences.gpt
        }
      },
      {
        round: 3,
        claude: {
          content: "Perfect collaboration! Combining our perspectives, here's a comprehensive approach that addresses both the theoretical foundation and practical implementation.",
          inputPrompt: "Claude wants to combine perspectives for a comprehensive approach. Provide a comprehensive approach that addresses both theoretical foundation and practical implementation.",
          processingStates: processingSequences.complex
        },
        gpt: {
          content: "Outstanding synthesis! This gives you a complete framework that you can implement immediately while also understanding the deeper principles involved.",
          inputPrompt: "Claude provided a comprehensive approach. Synthesize everything into a complete framework with immediate implementation and deeper principles.",
          processingStates: processingSequences.complex
        }
      }
    ]
  };
};

// Dynamic conversation flows with agreement-based collaboration
export const dynamicConversationFlows: Record<string, DynamicConversationFlow> = {
  vibeCoding: {
    userPrompt: "If I wanted to start a website and have never coded before how would I go about starting to become a vibe coder to create it?",
    maxExchanges: 3,
    reachedAgreement: true,
    exchanges: [
      {
        exchangeId: 1,
        gptResponse: {
          content: "Becoming a vibe coder is all about finding your creative flow! Here's the path that'll get you there:\n\n**The Vibe Coder Mindset:**\n- Code as creative expression, not just logic\n- Build things you're passionate about\n- Embrace the learning process\n\n**Your 90-Day Plan:**\n\n**Days 1-30: Foundation**\n- freeCodeCamp HTML/CSS\n- Build 3 simple pages daily\n- Follow design inspiration on Dribbble\n\n**Days 31-60: JavaScript Magic**\n- Interactive elements\n- Animations and transitions\n- Your first dynamic website\n\n**Days 61-90: Framework Fun**\n- Learn React or Vue\n- Build your dream project\n\nStart with something you care about - a hobby site, personal brand, or cause you believe in. What excites you most?",
          inputPrompt: "User wants to start a website having never coded before and become a 'vibe coder'. Provide guidance on the coding journey with an enthusiastic, creative approach.",
          processingStates: processingSequences.gpt
        },
        claudeReview: {
          content: "I love GPT-4's enthusiasm and the 90-day structure! However, I think we can make this even more actionable with modern tools and a clearer learning path. Let me build on this:\n\n**Modern Vibe Coder Stack:**\n- **Tailwind CSS** - Style without leaving HTML\n- **Next.js** - React framework that just works\n- **Vercel** - Deploy in 30 seconds\n- **Supabase** - Backend without the headache\n\n**Enhanced Learning Path:**\nWeek 1-2: HTML basics + Tailwind\nWeek 3-4: JavaScript fundamentals\nWeek 5-8: React with Next.js\nWeek 9-12: Full-stack with Supabase\n\n**Daily Vibe Ritual:**\n☕ Morning: 30 mins learning\n🎯 Focus: 2-3 hours building\n🚀 Evening: Ship something small\n\nWhat do you think about focusing on this modern stack from the start?",
          inputPrompt: "GPT-4 provided a great 90-day plan with good mindset advice. Build on this with modern web development tools, more specific timeline, and daily workflow suggestions.",
          agreementStatus: 'partial',
          suggestions: 'Add modern tools like Tailwind, Next.js, and more specific weekly breakdown',
          processingStates: processingSequences.claude
        },
        gptCounter: {
          content: "Claude's modern stack suggestion is brilliant! You're absolutely right - starting with modern tools from day one is much better than learning outdated approaches. Let me refine the plan:\n\n**Updated Vibe Coder Journey:**\n\n**Month 1: Modern Foundations**\n- HTML + Tailwind CSS (skip traditional CSS)\n- JavaScript ES6+ fundamentals\n- Git and GitHub basics\n- Deploy first site to Vercel\n\n**Month 2: React + Next.js**\n- Component thinking\n- State management\n- Routing and navigation\n- Build 3 projects with increasing complexity\n\n**Month 3: Full-Stack Vibes**\n- Supabase integration\n- Authentication\n- Database operations\n- Launch your signature project\n\n**The Modern Vibe Workflow:**\n- Design in Figma → Build with Tailwind → Deploy with Vercel\n- Learn by building real projects, not tutorials\n- Join the #buildinpublic community for accountability\n\nThis approach gets you to modern, production-ready skills faster!",
          inputPrompt: "Claude suggested focusing on modern tools (Tailwind, Next.js, Vercel, Supabase) from the start rather than traditional learning path. Agree and refine the plan with this modern approach.",
          processingStates: processingSequences.gpt
        },
        claudeFinal: {
          content: "Perfect! Now we have a cohesive, modern approach. Let me add the final piece - **community and mindset**:\n\n**Your Vibe Coder Support System:**\n- **Discord communities**: Reactiflux, The Coding Den\n- **Twitter**: Follow #buildinpublic, #100DaysOfCode\n- **YouTube**: Kevin Powell (CSS), Theo (React/Next.js)\n- **Practice**: Frontend Mentor challenges\n\n**Success Metrics (Not Lines of Code!):**\n✓ Projects that solve real problems\n✓ Code that brings you joy\n✓ Community connections made\n✓ Creative expression through technology\n\n**Your First Project Ideas:**\n1. Personal portfolio with your unique style\n2. Tool that solves your own daily problem\n3. Landing page for a cause you care about\n\nRemember: You're not just learning to code - you're learning to create digital experiences that reflect your vision. The modern stack we've outlined will get you there faster and with more joy! 🎨✨",
          inputPrompt: "GPT-4 agreed with the modern approach and refined the timeline. Add community aspects, success metrics focused on creativity rather than technical metrics, and inspirational conclusion.",
          agreementStatus: 'agree',
          processingStates: processingSequences.claude
        }
      }
    ]
  },

  writingAssistance: {
    userPrompt: "Help me write a compelling email to potential customers about our new product launch.",
    maxExchanges: 2,
    reachedAgreement: true,
    exchanges: [
      {
        exchangeId: 1,
        gptResponse: {
          content: "I'd love to help you create a compelling product launch email! Here's a proven framework:\n\n**Email Structure:**\n1. **Subject Line**: Create urgency or curiosity\n2. **Opening**: Personal connection or pain point\n3. **Product Introduction**: Brief, benefit-focused\n4. **Social Proof**: Testimonials or early results\n5. **Clear CTA**: Specific next step\n\n**Key Elements:**\n- Keep it scannable (short paragraphs, bullet points)\n- Focus on benefits, not features\n- Include scarcity or urgency\n- Mobile-optimized design\n\nTo customize this further, what's your product and who's your target audience?",
          inputPrompt: "User wants help with a compelling product launch email. Provide a proven email structure framework and ask for specifics to customize the approach.",
          processingStates: processingSequences.gpt
        },
        claudeReview: {
          content: "Great framework, GPT-4! I agree with the structure, but I think we should add more specific copywriting techniques and psychological triggers. Let me enhance this:\n\n**Enhanced Email Formula:**\n\n**Subject Line Formulas:**\n- \"[Specific Benefit] is finally here\"\n- \"The [problem] solution you've been waiting for\"\n- \"[Number] people can't be wrong about [product]\"\n\n**Psychology-Driven Body:**\n1. **Hook**: Start with a relatable problem (1 sentence)\n2. **Agitate**: Make them feel the pain briefly\n3. **Solution**: Introduce your product as the hero\n4. **Proof**: One powerful statistic or testimonial\n5. **Urgency**: Limited time/quantity\n6. **CTA**: Action-oriented button text\n\n**Advanced Tips:**\n- Use \"you\" 3x more than \"we\"\n- Include a P.S. line (highest read rate)\n- A/B test subject lines\n\nShall we create a specific template based on your industry?",
          inputPrompt: "GPT-4 provided a solid email structure. Enhance this with specific copywriting formulas, psychological triggers, and advanced optimization techniques.",
          agreementStatus: 'agree',
          suggestions: 'Add specific copywriting formulas and psychological principles',
          processingStates: processingSequences.claude
        }
      },
      {
        exchangeId: 2,
        gptResponse: {
          content: "Excellent additions, Claude! The psychological triggers and specific formulas make this much more actionable. Let me add the final optimization layer:\n\n**Complete Email Template:**\n\n**Subject**: [Benefit] + [Urgency] (under 50 chars)\n**Preview**: Expand on the benefit (90 chars)\n\n**Body Structure:**\n```\nProblem hook (15-20 words)\n\nAgitate briefly (2-3 lines)\n\nIntroduce solution with emotional appeal\n\"Imagine [desired outcome]...\"\n\n• Key benefit 1\n• Key benefit 2  \n• Key benefit 3\n\n[Testimonial or statistic]\n\n[CTA Button: Action Verb + Benefit]\n\nP.S. [Urgency or bonus]\n```\n\n**Pre-Send Checklist:**\n✓ Mobile responsive\n✓ Single, prominent CTA\n✓ Unsubscribe link\n✓ Send Tuesday-Thursday, 10-11 AM\n✓ A/B test with 10% of list first\n\nThis combines structure + psychology + optimization for maximum impact!",
          inputPrompt: "Claude enhanced the framework with copywriting formulas and psychological triggers. Add a complete template with specific formatting, pre-send checklist, and timing optimization.",
          processingStates: processingSequences.gpt
        },
        claudeReview: {
          content: "Perfect! This is exactly what someone needs for a successful product launch email. The combination of proven structure, psychological principles, and practical optimization creates a comprehensive solution.\n\n**What makes this framework powerful:**\n✓ Psychology-backed (problem-agitate-solve)\n✓ Conversion-optimized (single CTA, mobile-first)\n✓ Actionable (specific templates and checklists)\n✓ Testable (A/B testing guidance)\n\nThe user now has everything they need: strategy, tactics, template, and execution guidance. This collaborative approach gave us a much stronger result than either of us could have provided alone!\n\nReady to help them implement this for their specific product and audience! 🚀",
          inputPrompt: "GPT-4 created a complete email template with optimization checklist. Provide final validation of the collaborative approach and summarize the comprehensive solution we've created together.",
          agreementStatus: 'agree',
          processingStates: processingSequences.claude
        }
      }
    ]
  }
};