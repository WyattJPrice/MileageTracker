"use client"

import { format } from "date-fns"
import type { Activity } from "@/lib/types"

function formatPace(movingTimeSec: number, distanceMiles: number): string {
  if (distanceMiles < 0.01) return "—"
  const paceSecPerMile = movingTimeSec / distanceMiles
  const min = Math.floor(paceSecPerMile / 60)
  const sec = Math.round(paceSecPerMile % 60)
  return `${min}:${sec.toString().padStart(2, "0")}/mi`
}

interface WeekRunsListProps {
  runs: Activity[]
  isLoading: boolean
}

export function WeekRunsList({ runs, isLoading }: WeekRunsListProps) {
  const totalMiles = runs.reduce((s, r) => s + r.distance_miles, 0)

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 h-full">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">This Week</p>
        {runs.length > 0 && (
          <span className="font-mono text-sm tabular-nums text-zinc-300">
            {totalMiles.toFixed(1)} mi total
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 rounded bg-zinc-800 animate-pulse" />
          ))}
        </div>
      ) : runs.length === 0 ? (
        <p className="text-sm text-zinc-600">No runs this week</p>
      ) : (
        <ul className="space-y-2">
          {runs.map((r) => (
            <li key={r.id} className="flex items-baseline gap-3 text-sm">
              <span className="w-12 shrink-0 text-xs text-zinc-500">
                {format(new Date(r.date + "T00:00:00"), "EEE")}
              </span>
              <span className="font-mono tabular-nums text-zinc-200">
                {r.distance_miles.toFixed(2)} mi
              </span>
              <span className="text-zinc-500">
                {formatPace(r.moving_time_seconds, r.distance_miles)}
              </span>
              {r.name && (
                <span className="truncate text-zinc-600">{r.name}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
