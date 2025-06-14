"use client"

import { useEffect, useState } from "react"

interface ClientDateProps {
  date: string | Date
  format?: "date" | "datetime" | "relative"
  className?: string
}

export function ClientDate({ date, format = "date", className }: ClientDateProps) {
  const [formattedDate, setFormattedDate] = useState<string>("")

  useEffect(() => {
    const dateObj = typeof date === "string" ? new Date(date) : date
    let formatted: string
    
    if (format === "relative") {
      const now = new Date()
      const diffMs = now.getTime() - dateObj.getTime()
      const diffMins = Math.floor(diffMs / (1000 * 60))
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))
      
      if (diffMins < 1) {
        formatted = "just now"
      } else if (diffMins < 60) {
        formatted = `${diffMins}m ago`
      } else if (diffHours < 24) {
        formatted = `${diffHours}h ago`
      } else if (diffDays < 7) {
        formatted = `${diffDays}d ago`
      } else {
        formatted = dateObj.toLocaleDateString()
      }
    } else if (format === "date") {
      formatted = dateObj.toLocaleDateString()
    } else {
      formatted = dateObj.toLocaleString()
    }
    
    setFormattedDate(formatted)
  }, [date, format])

  // Return empty string during SSR to prevent hydration mismatch
  if (!formattedDate) {
    return <span className={className}>Loading...</span>
  }

  return <span className={className}>{formattedDate}</span>
} 