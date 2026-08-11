"use client"

import { format, startOfWeek, addDays } from "date-fns"
import type { Activity, ICalEvent } from "@/lib/types"

function buildWeek(): string[] {
  const sunday = startOfWeek(new Date(), { weekStartsOn: 0 })
  return Array.from({ length: 7 }, (_, i) =>
    format(addDays(sunday, i), "yyyy-MM-dd")
  )
}

function parsePlannedMiles(description?: string): number | null {
  if (!description) return null
  const m = description.match(/planned[:\s]+(\d+(?:\.\d+)?)\s*mi/i)
  return m ? parseFloat(m[1]) : null
}

interface WeekRunsListProps {
  runs: Activity[]
  isLoading: boolean
  upcomingEvents?: ICalEvent[]
}

export function WeekRunsList({ runs, isLoading, upcomingEvents = [] }: WeekRunsListProps) {
  const totalMiles = runs.reduce((s, r) => s + r.distance_miles, 0)
  const todayStr = format(new Date(), "yyyy-MM-dd")
  const week = buildWeek()

  const byDate = new Map<string, number>()
  for (const r of runs) {
    byDate.set(r.date, (byDate.get(r.date) ?? 0) + r.distance_miles)
  }

  const weekSet = new Set(week)
  const plannedByDate = new Map<string, number>()
  for (const e of upcomingEvents) {
    if (!weekSet.has(e.date)) continue
    const mi = parsePlannedMiles(e.description)
    if (mi !== null) plannedByDate.set(e.date, (plannedByDate.get(e.date) ?? 0) + mi)
  }

  const plannedTotal = week.reduce((s, date) => {
    return byDate.has(date) ? s : s + (plannedByDate.get(date) ?? 0)
  }, 0)

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 h-full flex flex-col">
      <div className="mb-2 shrink-0 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">This Week</p>
        <div className="flex items-center gap-3 font-mono text-sm tabular-nums">
          {plannedTotal > 0 && (
            <span className="text-zinc-600">{plannedTotal.toFixed(1)} planned</span>
          )}
          {totalMiles > 0 && (
            <span className="text-zinc-100">{totalMiles.toFixed(1)} mi</span>
          )}
        </div>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-7 content-center gap-1">
        {isLoading
          ? Array.from({ length: 7 }, (_, i) => (
              <div key={i} className="flex flex-col items-center justify-center gap-1.5 rounded-[10px] py-1 px-1">
                <div className="h-2.5 w-8 rounded bg-zinc-800 animate-pulse" />
                <div className="h-6 w-10 rounded bg-zinc-800 animate-pulse" />
              </div>
            ))
          : week.map((date) => {
              const mi = byDate.get(date)
              const plannedMi = !mi ? plannedByDate.get(date) : undefined
              const isToday = date === todayStr
              const isFuture = date > todayStr
              const dayLabel = format(new Date(date + "T00:00:00"), "EEE")

              return (
                <div
                  key={date}
                  className={`flex flex-col items-center justify-center rounded-[10px] py-1 px-1 ${
                    isToday ? "bg-[#27272A]" : ""
                  }`}
                >
                  <span
                    className={`text-sm font-medium ${
                      isToday ? "text-neon" : isFuture ? "text-zinc-600" : "text-zinc-500"
                    }`}
                  >
                    {dayLabel}
                  </span>
                  <span
                    className={`mt-1 font-mono text-xl font-semibold tabular-nums leading-none ${
                      mi
                        ? "text-zinc-100"
                        : plannedMi
                          ? "text-zinc-600"
                          : isFuture
                            ? "text-zinc-700"
                            : "text-zinc-600"
                    }`}
                  >
                    {mi ? mi.toFixed(1) : plannedMi ? plannedMi.toFixed(1) : "—"}
                  </span>
                </div>
              )
            })}
      </div>
    </div>
  )
}
