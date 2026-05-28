"use client"

import * as React from "react"

export function RotatePrompt() {
  const [isPortrait, setIsPortrait] = React.useState(false)
  const [isMobile, setIsMobile] = React.useState(false)

  React.useEffect(() => {
    const check = () => {
      const mobile = window.matchMedia("(max-width: 768px)").matches
      const portrait = window.matchMedia("(orientation: portrait)").matches
      setIsMobile(mobile)
      setIsPortrait(portrait)
    }

    check()
    window.addEventListener("resize", check)
    const mql = window.matchMedia("(orientation: portrait)")
    mql.addEventListener("change", check)

    return () => {
      window.removeEventListener("resize", check)
      mql.removeEventListener("change", check)
    }
  }, [])

  if (!isMobile || !isPortrait) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-zinc-950/95 px-8 backdrop-blur-sm">
      <svg
        viewBox="0 0 24 24"
        className="h-12 w-12 text-zinc-400 animate-[rock_1.5s_ease-in-out_infinite_alternate]"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <path d="M12 18h.01" />
      </svg>
      <p className="text-center text-sm text-zinc-400">
        Rotate your device to landscape for the best chart experience
      </p>
    </div>
  )
}
