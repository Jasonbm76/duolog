import Navigation from "@/components/Navigation"
import Hero from "@/components/Hero"
import Features from "@/components/Features"
import PageAnalytics from "@/components/PageAnalytics"
import AnalyticsTest from "@/components/AnalyticsTest"

export default function Home() {
  return (
    <main className="min-h-screen">
      <PageAnalytics />
      <Navigation />
      <Hero />
      <Features />
      <AnalyticsTest />
    </main>
  )
}
