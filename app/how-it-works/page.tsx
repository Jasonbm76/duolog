'use client'

import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { ArrowRight, MessageSquare, Sparkles, GitBranch, Zap, Bot, Users, Target } from 'lucide-react'

export default function HowItWorksPage() {
  return (
    <div className="relative">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary-900 via-background to-primary-900/20 -z-10" />

      <Navigation />

      {/* Hero Section */}
      <section className="pt-64 pb-20 px-0 md:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6 mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-on-dark">
              How Duolog Works
            </h1>
            <p className="text-xl text-on-dark-muted max-w-3xl mx-auto">
              Experience the power of AI collaboration. Watch as Claude and GPT-4 work together
              to transform your ideas into refined, production-ready prompts.
            </p>
          </div>
        </div>
      </section>

      {/* Process Steps */}
      <section className="py-20 px-0 md:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="space-y-24">
            {/* Step 1 */}
            <div className="flex flex-col md:flex-row gap-12 items-center">
              <div className="flex-1 space-y-6">
                <div className="inline-flex items-center gap-3 text-primary">
                  <MessageSquare className="w-8 h-8" />
                  <span className="text-sm font-semibold uppercase tracking-wider">Step 1</span>
                </div>
                <h2 className="text-4xl font-bold text-on-dark">
                  Start with Your Idea
                </h2>
                <p className="text-lg text-on-dark-muted">
                  Begin with a concept, a problem, or even just a vague notion. Our intelligent
                  interface guides you through the initial prompt creation, helping you articulate
                  your thoughts clearly.
                </p>
                <ul className="space-y-3">
                  <li className="flex items-start gap-3">
                    <Zap className="w-5 h-5 text-warning mt-1" />
                    <span className="text-on-dark-muted">Smart suggestions help you get started</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Zap className="w-5 h-5 text-warning mt-1" />
                    <span className="text-on-dark-muted">Templates for common use cases</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Zap className="w-5 h-5 text-warning mt-1" />
                    <span className="text-on-dark-muted">Context-aware prompt building</span>
                  </li>
                </ul>
              </div>
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-secondary-500/20 blur-3xl" />
                  <div className="relative bg-background/10 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-error rounded-full" />
                        <div className="w-2 h-2 bg-warning rounded-full" />
                        <div className="w-2 h-2 bg-success rounded-full" />
                      </div>
                      <div className="space-y-3">
                        <div className="h-4 bg-white/10 rounded w-3/4" />
                        <div className="h-4 bg-white/10 rounded w-full" />
                        <div className="h-4 bg-white/10 rounded w-5/6" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2 */}
            <div className="flex flex-col md:flex-row-reverse gap-12 items-center">
              <div className="flex-1 space-y-6">
                <div className="inline-flex items-center gap-3 text-secondary">
                  <Bot className="w-8 h-8" />
                  <span className="text-sm font-semibold uppercase tracking-wider">Step 2</span>
                </div>
                <h2 className="text-4xl font-bold text-on-dark">
                  AI Collaboration Begins
                </h2>
                <p className="text-lg text-on-dark-muted">
                  Your prompt is simultaneously sent to Claude and GPT-4. Each AI analyzes your
                  intent, identifies areas for improvement, and suggests enhancements based on
                  their unique strengths.
                </p>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h3 className="font-semibold text-on-dark flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-primary" />
                      Claude's Strengths
                    </h3>
                    <ul className="space-y-2 text-sm text-on-dark-muted">
                      <li>• Nuanced understanding</li>
                      <li>• Creative solutions</li>
                      <li>• Ethical considerations</li>
                    </ul>
                  </div>
                  <div className="space-y-3">
                    <h3 className="font-semibold text-on-dark flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-secondary" />
                      GPT-4's Strengths
                    </h3>
                    <ul className="space-y-2 text-sm text-on-dark-muted">
                      <li>• Technical precision</li>
                      <li>• Broad knowledge</li>
                      <li>• Systematic approach</li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-l from-secondary-500/20 to-primary-500/20 blur-3xl" />
                  <div className="relative space-y-4">
                    <div className="bg-background/10 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl transform -rotate-3">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center">
                          <Bot className="w-4 h-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium text-on-dark">Claude</span>
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 bg-primary/20 rounded w-full" />
                        <div className="h-3 bg-primary/20 rounded w-4/5" />
                      </div>
                    </div>
                    <div className="bg-background/10 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl transform rotate-3">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-secondary/20 rounded-full flex items-center justify-center">
                          <Bot className="w-4 h-4 text-secondary" />
                        </div>
                        <span className="text-sm font-medium text-on-dark">GPT-4</span>
                      </div>
                      <div className="space-y-2">
                        <div className="h-3 bg-secondary/20 rounded w-full" />
                        <div className="h-3 bg-secondary/20 rounded w-3/4" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3 */}
            <div className="flex flex-col md:flex-row gap-12 items-center">
              <div className="flex-1 space-y-6">
                <div className="inline-flex items-center gap-3 text-success">
                  <GitBranch className="w-8 h-8" />
                  <span className="text-sm font-semibold uppercase tracking-wider">Step 3</span>
                </div>
                <h2 className="text-4xl font-bold text-on-dark">
                  Intelligent Synthesis
                </h2>
                <p className="text-lg text-on-dark-muted">
                  Our advanced synthesis engine combines the best insights from both AIs, creating
                  a refined prompt that captures the strengths of each model while eliminating
                  redundancies and conflicts.
                </p>
                <div className="bg-background/10 backdrop-blur-xl border border-white/10 rounded-xl p-6">
                  <h3 className="font-semibold text-on-dark mb-4 flex items-center gap-2">
                    <Users className="w-5 h-5 text-success" />
                    Synthesis Process
                  </h3>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-success/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-success">1</span>
                      </div>
                      <span className="text-sm text-on-dark-muted">Analyze both AI responses for unique insights</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-success/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-success">2</span>
                      </div>
                      <span className="text-sm text-on-dark-muted">Identify complementary suggestions</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-success/20 rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-bold text-success">3</span>
                      </div>
                      <span className="text-sm text-on-dark-muted">Merge into a cohesive, enhanced prompt</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex-1">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-success-500/20 to-primary-500/20 blur-3xl" />
                  <div className="relative bg-background/10 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
                    <div className="text-center space-y-4">
                      <div className="w-16 h-16 bg-success/20 rounded-full flex items-center justify-center mx-auto">
                        <Target className="w-8 h-8 text-success" />
                      </div>
                      <h3 className="text-xl font-semibold text-on-dark">Final Result</h3>
                      <p className="text-sm text-on-dark-muted">
                        A refined, production-ready prompt that leverages the best of both AI models
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-0 md:px-6 border-t border-white/10">
        <div className="container mx-auto max-w-4xl text-center space-y-8">
          <h2 className="text-4xl font-bold text-on-dark">
            Ready to Experience AI Collaboration?
          </h2>
          <p className="text-lg text-on-dark-muted">
            Join thousands of developers, writers, and creators who are already using Duolog
            to craft better AI prompts.
          </p>
          <a
            href="/chat"
            className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-full font-semibold hover:bg-primary-700 transition-colors"
          >
            Start Creating Now
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  )
}