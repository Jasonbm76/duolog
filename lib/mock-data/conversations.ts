import { Message } from '@/lib/types/chat';

// Mock responses for different scenarios
export const mockConversationFlows = {
  // Example 1: Writing assistance
  writingAssistance: {
    userPrompt: "Help me write a compelling email to potential customers about our new product launch.",
    rounds: [
      {
        round: 1,
        claude: "I'd be happy to help you craft a compelling product launch email. To create the most effective message, I need a few more details:\n\n1. What type of product are you launching?\n2. Who is your target audience?\n3. What's the key benefit or unique selling point?\n4. What action do you want recipients to take?\n\nWith these details, I can help you structure an email that captures attention and drives engagement.",
        gpt: "Great idea to reach out to potential customers! For a compelling product launch email, consider this structure:\n\n**Subject Line**: Create urgency or curiosity\n**Opening**: Personal connection or pain point\n**Product Introduction**: Brief, benefit-focused\n**Social Proof**: Testimonials or early results\n**Clear CTA**: Specific next step\n\nWhat's your product and target audience? I can help customize this framework for maximum impact."
      },
      {
        round: 2,
        claude: "Excellent framework from GPT-4! Let me build on that with specific copywriting techniques:\n\n**Subject Line Formulas**:\n- \"[Product] is here - [specific benefit]\"\n- \"The [problem] solution you've been waiting for\"\n\n**Email Structure**:\n1. Hook with a relatable problem (15-20 words)\n2. Introduce solution with emotional appeal\n3. Use \"imagine\" or \"picture this\" for visualization\n4. Include one powerful statistic or testimonial\n5. Single, action-oriented CTA button\n\n**Tone**: Conversational, confident, but not pushy. What industry are you in? This affects the language style significantly.",
        gpt: "Building on Claude's excellent structure, here are proven conversion tactics:\n\n**Psychology Elements**:\n- Scarcity: \"Limited early access\" or \"First 100 customers\"\n- Social proof: \"Join 500+ beta users who've already...\"\n- Loss aversion: \"Don't miss out on...\"\n\n**Format Tips**:\n- Keep paragraphs 1-2 lines max\n- Use bullet points for features/benefits\n- Include a P.S. line (high read rate)\n- Mobile-first design (60%+ will read on mobile)\n\nShall we draft a specific version based on your product details?"
      },
      {
        round: 3,
        claude: "Perfect collaboration! Let me synthesize our insights into an actionable template:\n\n**Ultimate Product Launch Email Template**:\n\n*Subject*: [Specific Benefit] + [Urgency/Curiosity]\n\n*Body*:\n- Problem hook (1 sentence)\n- Solution introduction with emotional appeal\n- \"Imagine...\" visualization\n- One powerful proof point\n- Clear benefit bullets (3 max)\n- Single CTA button\n- P.S. with urgency or bonus\n\n**Next Steps**: \n1. Define your specific product/audience\n2. Choose your strongest proof point\n3. Test 2-3 subject lines\n4. A/B test with small segment first\n\nThis framework combines both our strengths - structure + psychology + practical implementation.",
        gpt: "Excellent synthesis, Claude! I'll add the final optimization layer:\n\n**Pre-Send Checklist**:\n✓ Subject line under 50 characters\n✓ Preview text optimized (first 90 characters)\n✓ Single, prominent CTA button\n✓ Mobile responsive design\n✓ Unsubscribe link included\n✓ Sender name recognizable\n\n**Success Metrics to Track**:\n- Open rate (aim for 20-25%)\n- Click-through rate (aim for 3-5%)\n- Conversion rate (varies by industry)\n\n**Pro Tip**: Send Tuesday-Thursday, 10-11 AM for highest engagement.\n\nYou now have a complete, battle-tested framework that combines strategic thinking with tactical execution!"
      }
    ]
  },

  // Example 2: Technical problem solving
  technicalProblem: {
    userPrompt: "I'm building a React app and getting memory leaks. How can I identify and fix them?",
    rounds: [
      {
        round: 1,
        claude: "Memory leaks in React apps are common but fixable! Let's start with identification:\n\n**Detection Tools**:\n1. Chrome DevTools Memory tab\n2. React DevTools Profiler\n3. Performance.measureUserAgentSpecificMemory() API\n\n**Common Leak Sources**:\n- Event listeners not cleaned up\n- Intervals/timeouts not cleared\n- Subscriptions (WebSocket, API) not cancelled\n- Closures holding references\n- Third-party library integrations\n\nWhat symptoms are you seeing? Browser crashes, slow performance, or specific error messages?",
        gpt: "Great question! Memory leaks in React are usually preventable with proper cleanup. Here's my diagnostic approach:\n\n**Quick Identification**:\n```javascript\n// Add to useEffect for monitoring\nuseEffect(() => {\n  const checkMemory = () => {\n    console.log('Memory usage:', performance.memory?.usedJSHeapSize);\n  };\n  const interval = setInterval(checkMemory, 5000);\n  return () => clearInterval(interval);\n}, []);\n```\n\n**Most Common Culprits**:\n1. useEffect without cleanup\n2. Event listeners on window/document\n3. Subscriptions not unsubscribed\n4. State updates after unmount\n\nWhich components or features are you suspecting?"
      },
      {
        round: 2,
        claude: "Excellent monitoring approach, GPT-4! Let me add specific cleanup patterns:\n\n**The Ultimate Cleanup Hook**:\n```javascript\nfunction useCleanup() {\n  const cleanupFunctions = useRef([]);\n  \n  const addCleanup = useCallback((fn) => {\n    cleanupFunctions.current.push(fn);\n  }, []);\n  \n  useEffect(() => {\n    return () => {\n      cleanupFunctions.current.forEach(fn => fn());\n    };\n  }, []);\n  \n  return addCleanup;\n}\n```\n\n**Event Listener Pattern**:\n```javascript\nuseEffect(() => {\n  const handleResize = () => setSize(window.innerWidth);\n  window.addEventListener('resize', handleResize);\n  return () => window.removeEventListener('resize', handleResize);\n}, []);\n```\n\nAre you using any specific libraries like Socket.io, Firebase, or state management tools?",
        gpt: "Love that cleanup hook pattern, Claude! Let me add automated leak detection:\n\n**Leak Detection Hook**:\n```javascript\nfunction useLeakDetection(componentName) {\n  useEffect(() => {\n    const startMemory = performance.memory?.usedJSHeapSize;\n    \n    return () => {\n      setTimeout(() => {\n        const endMemory = performance.memory?.usedJSHeapSize;\n        const leak = endMemory - startMemory;\n        if (leak > 1000000) { // 1MB threshold\n          console.warn(`Potential leak in ${componentName}: ${leak} bytes`);\n        }\n      }, 100);\n    };\n  }, [componentName]);\n}\n```\n\n**AbortController for API Calls**:\n```javascript\nuseEffect(() => {\n  const controller = new AbortController();\n  fetch('/api/data', { signal: controller.signal })\n    .then(setData)\n    .catch(err => {\n      if (err.name !== 'AbortError') console.error(err);\n    });\n  return () => controller.abort();\n}, []);\n```"
      },
      {
        round: 3,
        claude: "Outstanding automated detection, GPT-4! Let me complete the picture with production-ready solutions:\n\n**Production Memory Monitoring**:\n```javascript\n// Custom hook for production monitoring\nfunction useMemoryMonitor() {\n  useEffect(() => {\n    if (process.env.NODE_ENV !== 'production') return;\n    \n    const observer = new PerformanceObserver((list) => {\n      list.getEntries().forEach((entry) => {\n        if (entry.name === 'measure') {\n          // Send to analytics\n          analytics.track('memory_usage', {\n            component: entry.detail?.componentName,\n            duration: entry.duration,\n            memory: performance.memory?.usedJSHeapSize\n          });\n        }\n      });\n    });\n    \n    observer.observe({ entryTypes: ['measure'] });\n    return () => observer.disconnect();\n  }, []);\n}\n```\n\n**Testing Strategy**:\n1. Use React Testing Library with memory assertions\n2. Set up memory thresholds in CI/CD\n3. Regular heap snapshots in staging\n\nYou now have detection, prevention, monitoring, and testing covered!",
        gpt: "Perfect comprehensive approach! Final piece - **Development Workflow Integration**:\n\n**ESLint Rules**:\n```json\n{\n  \"rules\": {\n    \"react-hooks/exhaustive-deps\": \"error\",\n    \"@typescript-eslint/no-floating-promises\": \"error\"\n  }\n}\n```\n\n**Memory Budget in package.json**:\n```json\n{\n  \"bundlesize\": [\n    {\n      \"path\": \"./build/static/js/*.js\",\n      \"maxSize\": \"250kb\"\n    }\n  ]\n}\n```\n\n**DevTools Extension**:\nInstall \"React Developer Tools\" + \"Memory\" tab workflow:\n1. Take heap snapshot before testing\n2. Interact with your app\n3. Force garbage collection\n4. Take another snapshot\n5. Compare for retained objects\n\n**Result**: You now have a complete memory leak prevention, detection, and monitoring system! 🎯"
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

// Mock function to get conversation flow based on initial prompt
export const getMockConversationFlow = (initialPrompt: string) => {
  const prompt = initialPrompt.toLowerCase();
  
  if (prompt.includes('email') || prompt.includes('write') || prompt.includes('copy')) {
    return mockConversationFlows.writingAssistance;
  } else if (prompt.includes('react') || prompt.includes('memory') || prompt.includes('bug') || prompt.includes('error')) {
    return mockConversationFlows.technicalProblem;
  }
  
  // Default generic response
  return {
    userPrompt: initialPrompt,
    rounds: [
      {
        round: 1,
        claude: "I understand you'd like help with this topic. Let me analyze your request and provide some initial thoughts and questions to better understand your specific needs.",
        gpt: "Great question! I'll work with Claude to provide you with comprehensive insights. Let me start by breaking down the key aspects of your request."
      },
      {
        round: 2,
        claude: "Building on GPT-4's analysis, I'd like to add some additional perspectives and dive deeper into the practical implications of your question.",
        gpt: "Excellent insights from Claude! Let me complement that with some specific strategies and actionable steps you can take."
      },
      {
        round: 3,
        claude: "Perfect collaboration! Combining our perspectives, here's a comprehensive approach that addresses both the theoretical foundation and practical implementation.",
        gpt: "Outstanding synthesis! This gives you a complete framework that you can implement immediately while also understanding the deeper principles involved."
      }
    ]
  };
};