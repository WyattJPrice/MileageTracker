"use client"

import { format, startOfWeek, addDays } from "date-fns"
import type { Activity } from "@/lib/types"

function buildWeek(): string[] {
  const sunday = startOfWeek(new Date(), { weekStartsOn: 0 })
  return Array.from({ length: 7 }, (_, i) =>
    format(addDays(sunday, i), "yyyy-MM-dd")
  )
}

interface WeekRunsListProps {
  runs: Activity[]
  isLoading: boolean
}

export function WeekRunsList({ runs, isLoading }: WeekRunsListProps) {
  const totalMiles = runs.reduce((s, r) => s + r.distance_miles, 0)
  const todayStr = format(new Date(), "yyyy-MM-dd")
  const week = buildWeek()

  const byDate = new Map<string, number>()
  for (const r of runs) {
    byDate.set(r.date, (byDate.get(r.date) ?? 0) + r.distance_miles)
  }

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-4 h-full flex flex-col">
      <div className="mb-3 shrink-0 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">This Week</p>
        {runs.length > 0 && (
          <span className="font-mono text-sm tabular-nums text-zinc-300">
            {totalMiles.toFixed(1)} mi
          </span>
        )}
      </div>

      <div className="grid grid-cols-7 gap-1 flex-1 min-h-0">
        {isLoading
          ? Array.from({ length: 7 }, (_, i) => (
              <div key={i} className="flex flex-col items-center justify-center gap-2 rounded-lg p-2">
                <div className="h-3 w-8 rounded bg-zinc-800 animate-pulse" />
                <div className="h-8 w-10 rounded bg-zinc-800 animate-pulse" />
              </div>
            ))
          : week.map((date) => {
              const mi = byDate.get(date)
              const isToday = date === todayStr
              const isFuture = date > todayStr
              const dayLabel = format(new Date(date + "T00:00:00"), "EEE")

              return (
                <div
                  key={date}
                  className={`flex flex-col items-center justify-center rounded-lg px-1 ${
                    isToday ? "bg-zinc-800" : ""
                  }`}
                >
                  <span
                    className={`text-sm font-medium ${
                      isToday ? "text-emerald-400" : isFuture ? "text-zinc-600" : "text-zinc-500"
                    }`}
                  >
                    {dayLabel}
                  </span>
                  <span
                    className={`mt-2 font-mono text-3xl font-semibold tabular-nums leading-none ${
                      mi ? "text-zinc-100" : isFuture ? "text-zinc-700" : "text-zinc-600"
                    }`}
                  >
                    {mi ? mi.toFixed(1) : "—"}
                  </span>
                </div>
              )
            })}
      </div>
    </div>
  )
}
