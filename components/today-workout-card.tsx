"use client"

import * as React from "react"
import type { ICalEvent } from "@/lib/types"

function cleanDesc(summary: string, description?: string | null): string | undefined {
  if (!description) return undefined
  return description
    .replace(/^Workout:\s*/i, "")
    .replace(new RegExp(`^${summary.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*`, "i"), "")
    .trim() || undefined
}

function useFitText(deps: unknown[]) {
  const ref = React.useRef<HTMLDivElement>(null)
  const [scale, setScale] = React.useState(1)

  React.useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    // Reset to full size then measure
    el.style.fontSize = ""
    const parent = el.parentElement
    if (!parent) return

    let s = 1
    while (el.scrollHeight > parent.clientHeight && s > 0.4) {
      s -= 0.05
      el.style.fontSize = `${s * 100}%`
    }
    setScale(s)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  return ref
}

interface TodayWorkoutCardProps {
  events: ICalEvent[]
  isLoading: boolean
}

export function TodayWorkoutCard({ events, isLoading }: TodayWorkoutCardProps) {
  const deduped = events.filter(
    (e) =>
      !events.some(
        (other) =>
          other !== e &&
          other.summary.toLowerCase().startsWith(e.summary.toLowerCase()) &&
          other.summary.length > e.summary.length
      )
  )

  const isRest = deduped.length === 1 && /rest\s*day/i.test(deduped[0]?.summary ?? "")
  const contentRef = useFitText([deduped])

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 h-full flex flex-col overflow-hidden">
      <p className="mb-3 shrink-0 text-xs font-medium uppercase tracking-wider text-zinc-400">
        Today&apos;s Workout
      </p>

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-7 w-48 rounded bg-zinc-800 animate-pulse" />
          <div className="h-4 w-32 rounded bg-zinc-800 animate-pulse" />
        </div>
      ) : (
        <div ref={contentRef} className="flex-1 min-h-0 flex flex-col justify-start">
          {deduped.length === 0 ? (
            <p className="text-lg font-semibold text-zinc-600">No planned workout</p>
          ) : isRest ? (
            <p className="text-2xl font-bold italic text-zinc-500">Rest Day</p>
          ) : (
            deduped.map((e, i) => {
              const isRace = /race/i.test(e.summary)
              const desc = cleanDesc(e.summary, e.description)
              return (
                <div key={i} className={i > 0 ? "mt-4" : ""}>
                  <p className={`text-xl lg:text-2xl font-bold leading-tight ${isRace ? "text-emerald-400" : "text-zinc-100"}`}>
                    {e.summary}
                  </p>
                  {desc && (
                    <p className="mt-2 text-sm text-zinc-400 whitespace-pre-line leading-relaxed">
                      {desc}
                    </p>
                  )}
                </div>
              )
            })
          )}
        </div>
      )}
    </div>
  )
}
