"use client"

import { format } from "date-fns"
import type { ICalEvent } from "@/lib/types"

interface UpcomingCardProps {
  events: ICalEvent[]
  isLoading: boolean
}

function dayDiff(dateStr: string): number {
  const d = new Date(dateStr + "T00:00:00")
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return Math.round((d.getTime() - today.getTime()) / 86_400_000)
}

function groupByDate(events: ICalEvent[]) {
  const map = new Map<string, ICalEvent[]>()
  for (const e of events) {
    const arr = map.get(e.date) ?? []
    arr.push(e)
    map.set(e.date, arr)
  }
  return Array.from(map.entries()).map(([date, items]) => {
    const deduped = items.filter(
      (e) =>
        !items.some(
          (other) =>
            other !== e &&
            other.summary.toLowerCase().startsWith(e.summary.toLowerCase()) &&
            other.summary.length > e.summary.length
        )
    )
    return { date, dayDiff: dayDiff(date), items: deduped }
  })
}

function formatEventDate(dateStr: string): string {
  const diff = dayDiff(dateStr)
  if (diff === 0) return "Today"
  if (diff === 1) return "Tomorrow"
  return format(new Date(dateStr + "T00:00:00"), "EEE, MMM d")
}

export function UpcomingCard({ events, isLoading }: UpcomingCardProps) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 h-full">
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-zinc-500">Upcoming</p>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="space-y-1">
              <div className="h-3 w-16 rounded bg-zinc-800 animate-pulse" />
              <div className="h-4 w-40 rounded bg-zinc-800 animate-pulse" />
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        <p className="text-sm text-zinc-600">No upcoming workouts</p>
      ) : (
        <div className="space-y-4">
          {groupByDate(events).map(({ date, dayDiff, items }) => (
            <div key={date}>
              <p className="mb-1.5 text-xs text-zinc-500">{formatEventDate(date)}</p>
              <div className="space-y-3">
                {items.map((e, i) => {
                  const isRest = /rest\s*day/i.test(e.summary)
                  const isRace = /race/i.test(e.summary)
                  const showDesc = dayDiff <= 1
                  const desc = showDesc
                    ? e.description
                        ?.replace(/^Workout:\s*/i, "")
                        .replace(new RegExp(`^${e.summary.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*`, "i"), "")
                        .trim()
                    : undefined
                  return (
                    <div key={i} className="space-y-0.5">
                      {isRest ? (
                        <p className="text-sm italic text-zinc-600">Rest day</p>
                      ) : isRace ? (
                        <p className="text-sm font-medium text-emerald-400">{e.summary}</p>
                      ) : (
                        <p className="text-sm font-medium text-zinc-200">{e.summary}</p>
                      )}
                      {!isRest && desc && (
                        <p className="text-xs text-zinc-500 leading-relaxed whitespace-pre-line">
                          {desc}
                        </p>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
