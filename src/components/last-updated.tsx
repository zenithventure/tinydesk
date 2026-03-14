"use client"

import { useEffect, useState } from "react"
import { RefreshCw } from "lucide-react"

interface LastUpdatedProps {
  timestamp: Date | null
  refreshing?: boolean
  className?: string
}

function timeAgo(date: Date): string {
  const secs = Math.floor((Date.now() - date.getTime()) / 1000)
  if (secs < 5) return "just now"
  if (secs < 60) return `${secs}s ago`
  const mins = Math.floor(secs / 60)
  if (mins < 60) return `${mins}m ago`
  return `${Math.floor(mins / 60)}h ago`
}

export function LastUpdated({ timestamp, refreshing = false, className = "" }: LastUpdatedProps) {
  const [label, setLabel] = useState("")

  useEffect(() => {
    if (!timestamp) return
    setLabel(timeAgo(timestamp))
    const id = setInterval(() => setLabel(timeAgo(timestamp)), 5000)
    return () => clearInterval(id)
  }, [timestamp])

  if (!timestamp) return null

  return (
    <div className={`flex items-center gap-1.5 text-xs text-gray-400 ${className}`}>
      <RefreshCw
        className={`w-3 h-3 transition-transform ${refreshing ? "animate-spin text-emerald-500" : ""}`}
      />
      <span>Updated {label}</span>
    </div>
  )
}
