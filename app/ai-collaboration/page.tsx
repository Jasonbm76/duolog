'use client'

import Navigation from '@/components/Navigation'
import Footer from '@/components/Footer'
import { Brain, Lightbulb, Shield, Gauge, Layers, RefreshCw, ArrowRight, Sparkles } from 'lucide-react'

export default function AICollaborationPage() {
  return (
    <div className="relative">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-primary-900 via-background to-primary-900/20 -z-10" />

      <Navigation />

      {/* Hero Section */}
      <section className="pt-64 pb-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center space-y-6 mb-16">
            <h1 className="text-5xl md:text-6xl font-bold text-on-dark">
              The Power of AI Collaboration
            </h1>
            <p className="text-xl text-on-dark-muted max-w-3xl mx-auto">
              Discover why having two leading AI models work together produces superior results
              compared to using either one alone.
            </p>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="py-20 px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-4xl font-bold text-on-dark">
                Why Two AIs Are Better Than One
              </h2>
              <p className="text-lg text-on-dark-muted">
                Just as human collaboration leads to better outcomes, AI collaboration harnesses
                the unique strengths of different models to create something greater than the
                sum of its parts.
              </p>
              <p className="text-lg text-on-dark-muted">
                Claude brings nuanced understanding and creative problem-solving, while GPT-4
                offers technical precision and broad knowledge. Together, they catch blind spots,
                enhance clarity, and produce prompts that are both innovative and practical.
              </p>
            </div>
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary-500/20 to-secondary-500/20 blur-3xl" />
              <div className="relative grid grid-cols-2 gap-4">
                <div className="space-y-4">
                  <div className="bg-background/10 backdrop-blur-xl border border-white/10 rounded-xl p-6 transform hover:scale-105 transition-transform">
                    <Brain className="w-8 h-8 text-primary mb-3" />
                    <h3 className="font-semibold text-on-dark mb-2">Deep Analysis</h3>
                    <p className="text-sm text-on-dark-muted">Multiple perspectives on your problem</p>
                  </div>
                  <div className="bg-background/10 backdrop-blur-xl border border-white/10 rounded-xl p-6 transform hover:scale-105 transition-transform">
                    <Shield className="w-8 h-8 text-success mb-3" />
                    <h3 className="font-semibold text-on-dark mb-2">Error Reduction</h3>
                    <p className="text-sm text-on-dark-muted">Cross-validation catches mistakes</p>
                  </div>
                </div>
                <div className="space-y-4 mt-8">
                  <div className="bg-background/10 backdrop-blur-xl border border-white/10 rounded-xl p-6 transform hover:scale-105 transition-transform">
                    <Lightbulb className="w-8 h-8 text-warning mb-3" />
                    <h3 className="font-semibold text-on-dark mb-2">Creative Solutions</h3>
                    <p className="text-sm text-on-dark-muted">Unique insights from each model</p>
                  </div>
                  <div className="bg-background/10 backdrop-blur-xl border border-white/10 rounded-xl p-6 transform hover:scale-105 transition-transform">
                    <Gauge className="w-8 h-8 text-secondary mb-3" />
                    <h3 className="font-semibold text-on-dark mb-2">Optimized Output</h3>
                    <p className="text-sm text-on-dark-muted">Best of both approaches combined</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 px-6 border-t border-white/10">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-on-dark mb-4">
              Real-World Benefits
            </h2>
            <p className="text-lg text-on-dark-muted max-w-2xl mx-auto">
              See how AI collaboration transforms your prompts into powerful tools
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-background/10 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-primary/50 transition-colors">
              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center mb-6">
                <Layers className="w-6 h-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold text-on-dark mb-3">
                Comprehensive Coverage
              </h3>
              <p className="text-on-dark-muted mb-4">
                Each AI model approaches your prompt from different angles, ensuring no important
                aspect is overlooked.
              </p>
              <ul className="space-y-2 text-sm text-on-dark-muted">
                <li className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-primary mt-0.5" />
                  <span>Technical accuracy from GPT-4</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-primary mt-0.5" />
                  <span>Contextual nuance from Claude</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-primary mt-0.5" />
                  <span>Combined for complete solutions</span>
                </li>
              </ul>
            </div>

            <div className="bg-background/10 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-secondary/50 transition-colors">
              <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center mb-6">
                <RefreshCw className="w-6 h-6 text-secondary" />
              </div>
              <h3 className="text-xl font-semibold text-on-dark mb-3">
                Iterative Refinement
              </h3>
              <p className="text-on-dark-muted mb-4">
                Watch as your prompts evolve through multiple rounds of AI collaboration,
                becoming more precise with each iteration.
              </p>
              <ul className="space-y-2 text-sm text-on-dark-muted">
                <li className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-secondary mt-0.5" />
                  <span>Initial prompt enhancement</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-secondary mt-0.5" />
                  <span>Cross-model validation</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-secondary mt-0.5" />
                  <span>Final optimization pass</span>
                </li>
              </ul>
            </div>

            <div className="bg-background/10 backdrop-blur-xl border border-white/10 rounded-2xl p-8 hover:border-success/50 transition-colors">
              <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-success" />
              </div>
              <h3 className="text-xl font-semibold text-on-dark mb-3">
                Quality Assurance
              </h3>
              <p className="text-on-dark-muted mb-4">
                Built-in validation ensures your prompts are clear, effective, and free from
                common pitfalls that single-model approaches might miss.
              </p>
              <ul className="space-y-2 text-sm text-on-dark-muted">
                <li className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-success mt-0.5" />
                  <span>Ambiguity detection</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-success mt-0.5" />
                  <span>Bias mitigation</span>
                </li>
                <li className="flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-success mt-0.5" />
                  <span>Output consistency</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-20 px-6 border-t border-white/10">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-on-dark mb-4">
              Perfect For Every Use Case
            </h2>
            <p className="text-lg text-on-dark-muted max-w-2xl mx-auto">
              From creative writing to technical documentation, AI collaboration enhances every type of prompt
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-background/10 backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-on-dark mb-4 flex items-center gap-2">
                <Brain className="w-5 h-5 text-primary" />
                Creative Projects
              </h3>
              <ul className="space-y-3 text-on-dark-muted">
                <li>• Story and narrative development</li>
                <li>• Character creation and dialogue</li>
                <li>• Marketing copy and content</li>
                <li>• Brand voice refinement</li>
              </ul>
            </div>

            <div className="bg-background/10 backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-on-dark mb-4 flex items-center gap-2">
                <Gauge className="w-5 h-5 text-secondary" />
                Technical Work
              </h3>
              <ul className="space-y-3 text-on-dark-muted">
                <li>• Code generation and debugging</li>
                <li>• API documentation</li>
                <li>• System architecture design</li>
                <li>• Technical specifications</li>
              </ul>
            </div>

            <div className="bg-background/10 backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-on-dark mb-4 flex items-center gap-2">
                <Lightbulb className="w-5 h-5 text-warning" />
                Research & Analysis
              </h3>
              <ul className="space-y-3 text-on-dark-muted">
                <li>• Data analysis prompts</li>
                <li>• Research methodologies</li>
                <li>• Competitive analysis</li>
                <li>• Market insights</li>
              </ul>
            </div>

            <div className="bg-background/10 backdrop-blur-xl border border-white/10 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-on-dark mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-success" />
                Business Solutions
              </h3>
              <ul className="space-y-3 text-on-dark-muted">
                <li>• Strategic planning</li>
                <li>• Process optimization</li>
                <li>• Customer communication</li>
                <li>• Training materials</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 border-t border-white/10">
        <div className="container mx-auto max-w-4xl text-center space-y-8">
          <h2 className="text-4xl font-bold text-on-dark">
            Experience the Future of Prompt Engineering
          </h2>
          <p className="text-lg text-on-dark-muted">
            Join the growing community of professionals who are leveraging AI collaboration
            to create better, more effective prompts.
          </p>
          <a
            href="/chat"
            className="inline-flex items-center gap-2 bg-primary text-white px-8 py-4 rounded-full font-semibold hover:bg-primary-700 transition-colors"
          >
            Try AI Collaboration Now
            <ArrowRight className="w-5 h-5" />
          </a>
        </div>
      </section>

      <Footer />
    </div>
  )
}