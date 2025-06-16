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
    "Two AI minds, better answers for everything. Watch them collaborate in real-time to give you the best possible answer.",
  generator: 'v0.dev',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <script defer data-domain="duolog.ai" src="https://plausible.io/js/script.pageview-props.revenue.tagged-events.js"></script>
      </head>
      <body 
        className={`${inter.className} antialiased`}
        suppressHydrationWarning={true}
      >
        {children}
        <Toaster 
          position="bottom-right" 
          toastOptions={{
            style: {
              background: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(6px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'white',
              marginBottom: '120px', // Above the input area
            },
          }}
        />
      </body>
    </html>
  )
}
