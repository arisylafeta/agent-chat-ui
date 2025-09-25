"use client"

import React from "react"

export default function GlassInputWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-foreground/5 backdrop-blur-xs transition-colors focus-within:border-violet-400/70 focus-within:bg-violet-500/10">
      {children}
    </div>
  )
}
