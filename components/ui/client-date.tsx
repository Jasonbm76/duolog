"use client"

import { useEffect, useState } from "react"

interface ClientDateProps {
  date: string | Date
  format?: "date" | "datetime"
  className?: string
}

export function ClientDate({ date, format = "date", className }: ClientDateProps) {
  const [formattedDate, setFormattedDate] = useState<string>("")

  useEffect(() => {
    const dateObj = typeof date === "string" ? new Date(date) : date
    const formatted = format === "date" 
      ? dateObj.toLocaleDateString()
      : dateObj.toLocaleString()
    setFormattedDate(formatted)
  }, [date, format])

  // Return empty string during SSR to prevent hydration mismatch
  if (!formattedDate) {
    return <span className={className}>Loading...</span>
  }

  return <span className={className}>{formattedDate}</span>
} 