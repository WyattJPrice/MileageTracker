"use client"

import type { ICalEvent } from "@/lib/types"

function cleanDesc(summary: string, description?: string | null): string | undefined {
  if (!description) return undefined
  return description
    .replace(/^Workout:\s*/i, "")
    .replace(new RegExp(`^${summary.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*`, "i"), "")
    .replace(/\bPlanned:\s*\d+(?:\.\d+)?\s*mi\b\s*[·\n]?\s*/gi, "")
    .trim() || undefined
}

interface TodayWorkoutCardProps {
  events: ICalEvent[]
  isLoading: boolean
  expanded?: boolean
}

export function TodayWorkoutCard({ events, isLoading, expanded = false }: TodayWorkoutCardProps) {
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

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 h-full flex flex-col overflow-hidden">
      <p className="mb-2 shrink-0 text-xs font-semibold uppercase tracking-wider text-zinc-300">
        Today&apos;s Workout
      </p>

      {isLoading ? (
        <div className="space-y-2">
          <div className="h-6 w-44 rounded bg-zinc-800 animate-pulse" />
          <div className="h-3 w-32 rounded bg-zinc-800 animate-pulse" />
        </div>
      ) : deduped.length === 0 ? (
        <p className="text-base font-semibold text-zinc-600">No planned workout</p>
      ) : isRest ? (
        <p className="text-xl font-bold italic text-zinc-500">Rest Day</p>
      ) : (
        <div className={expanded ? "flex-1 min-h-0 overflow-y-auto pr-1" : ""}>
          {deduped.map((e, i) => {
            const isRace = /race/i.test(e.summary)
            const desc = cleanDesc(e.summary, e.description)
            const planned = e.description?.match(/planned[:\s]+(\d+(?:\.\d+)?)\s*mi/i)
            return (
              <div key={i} className={i > 0 ? "mt-2" : ""}>
                <p className={`text-lg font-bold leading-tight truncate ${isRace ? "text-neon" : "text-zinc-100"}`}>
                  {e.summary}
                </p>
                {planned && (
                  <p className="mt-0.5 text-sm text-zinc-400">
                    Planned: {planned[1]} mi
                  </p>
                )}
                {desc && (
                  <p
                    className={`mt-1 text-sm text-zinc-300 whitespace-pre-line leading-relaxed ${
                      expanded ? "line-clamp-none" : "line-clamp-2"
                    }`}
                  >
                    {desc}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
