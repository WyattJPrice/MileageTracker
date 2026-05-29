"use client"

import { format } from "date-fns"
import type { Activity } from "@/lib/types"

function formatPace(movingTimeSec: number, distanceMiles: number): string {
  if (distanceMiles < 0.01) return "—"
  const paceSecPerMile = movingTimeSec / distanceMiles
  const min = Math.floor(paceSecPerMile / 60)
  const sec = Math.round(paceSecPerMile % 60)
  return `${min}:${sec.toString().padStart(2, "0")}`
}

interface DayGroup {
  date: string
  totalMiles: number
  runs: Activity[]
}

function groupByDay(runs: Activity[]): DayGroup[] {
  const map = new Map<string, Activity[]>()
  for (const r of runs) {
    const arr = map.get(r.date) ?? []
    arr.push(r)
    map.set(r.date, arr)
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, dayRuns]) => ({
      date,
      totalMiles: dayRuns.reduce((s, r) => s + r.distance_miles, 0),
      runs: dayRuns,
    }))
}

interface WeekRunsListProps {
  runs: Activity[]
  isLoading: boolean
}

export function WeekRunsList({ runs, isLoading }: WeekRunsListProps) {
  const totalMiles = runs.reduce((s, r) => s + r.distance_miles, 0)
  const days = groupByDay(runs)

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 h-full flex flex-col overflow-hidden">
      <div className="mb-3 shrink-0 flex items-center justify-between">
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
            <div key={i} className="h-6 rounded bg-zinc-800 animate-pulse" />
          ))}
        </div>
      ) : days.length === 0 ? (
        <p className="text-sm text-zinc-600">No runs this week</p>
      ) : (
        <ul className="space-y-2 overflow-y-auto min-h-0">
          {days.map((day) => (
            <li key={day.date} className="flex items-baseline gap-3 text-sm min-w-0">
              <span className="w-8 shrink-0 text-xs text-zinc-500">
                {format(new Date(day.date + "T00:00:00"), "EEE")}
              </span>
              <span className="font-mono tabular-nums text-zinc-200 shrink-0">
                {day.totalMiles.toFixed(2)} mi
              </span>
              <span className="truncate text-xs text-zinc-500 whitespace-nowrap">
                {day.runs.map((r) =>
                  `${r.distance_miles.toFixed(2)}mi ${formatPace(r.moving_time_seconds, r.distance_miles)}/mi`
                ).join("  ·  ")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
