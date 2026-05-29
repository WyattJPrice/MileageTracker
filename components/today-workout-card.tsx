"use client"

import type { ICalEvent } from "@/lib/types"

function cleanDesc(summary: string, description?: string | null): string | undefined {
  if (!description) return undefined
  return description
    .replace(/^Workout:\s*/i, "")
    .replace(new RegExp(`^${summary.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*`, "i"), "")
    .trim() || undefined
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

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 flex flex-col">
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-400">
        Today&apos;s Workout
      </p>

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-7 w-48 rounded bg-zinc-800 animate-pulse" />
          <div className="h-4 w-32 rounded bg-zinc-800 animate-pulse" />
        </div>
      ) : (
        <div className="flex flex-col">
          {deduped.length === 0 ? (
            <p className="text-lg lg:text-xl font-semibold text-zinc-600">No planned workout</p>
          ) : isRest ? (
            <p className="text-2xl lg:text-3xl font-bold italic text-zinc-500">Rest Day</p>
          ) : (
            deduped.map((e, i) => {
              const isRace = /race/i.test(e.summary)
              const desc = cleanDesc(e.summary, e.description)
              return (
                <div key={i} className={i > 0 ? "mt-4" : ""}>
                  <p className={`text-xl lg:text-2xl 2xl:text-3xl font-bold leading-tight ${isRace ? "text-emerald-400" : "text-zinc-100"}`}>
                    {e.summary}
                  </p>
                  {desc && (
                    <p className="mt-2 text-sm lg:text-sm 2xl:text-base text-zinc-400 whitespace-pre-line leading-relaxed">
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
