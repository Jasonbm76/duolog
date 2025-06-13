import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { Toaster } from "@/components/ui/sonner"
import "./globals.css"

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
})

const baseTitle = "DuoLog.ai - Two AI minds. One perfect response."
const isDevelopment = process.env.NODE_ENV === 'development'

export const metadata: Metadata = {
  title: isDevelopment ? `Local | ${baseTitle}` : baseTitle,
  description:
    "Stop copy-pasting between ChatGPT and Claude. Watch them collaborate in real-time to give you the best possible answer.",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <script defer data-domain="duolog.ai" data-api="/api/analytics/event" src="/js/analytics"></script>
      </head>
      <body 
        className={`${inter.className} antialiased`}
        suppressHydrationWarning={true}
      >
        {children}
        <Toaster position="top-center" />
      </body>
    </html>
  )
}
