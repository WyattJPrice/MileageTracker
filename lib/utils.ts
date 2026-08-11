import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import {
  startOfWeek,
  startOfMonth,
  startOfYear,
  format,
  addDays,
  differenceInCalendarWeeks,
} from "date-fns"
import type { Activity, ActivityStream, ChartDataPoint } from "@/lib/types"

export type AggregationMode = "daily" | "weekly" | "monthly"

export const SPARKLINE_MAX_POINTS = 150

export function weekOfYear(date: Date): number {
  return (
    differenceInCalendarWeeks(date, startOfYear(date), {
      weekStartsOn: 0,
    }) + 1
  )
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function buildWeeklyByRange(
  activities: Activity[],
  range: { from?: Date; to?: Date } | undefined
): { date: string; week: number; miles: number | null }[] {
  if (!range?.from || !range?.to) return []
  const from = startOfWeek(range.from, { weekStartsOn: 0 })
  const to = range.to

  const buckets: { date: string; week: number; miles: number | null }[] = []
  let cursor = new Date(from)
  while (cursor <= to) {
    const weekStart = format(cursor, "yyyy-MM-dd")
    const weekEnd = format(addDays(cursor, 6), "yyyy-MM-dd")
    const week = weekOfYear(cursor)
    let miles = 0
    for (const a of activities) {
      if (a.date >= weekStart && a.date <= weekEnd) miles += a.distance_miles
    }
    buckets.push({
      date: weekStart,
      week,
      miles: miles > 0 ? parseFloat(miles.toFixed(1)) : null,
    })
    cursor = addDays(cursor, 7)
  }
  return buckets
}

export function downsampleStream(
  stream: ActivityStream,
  maxPoints: number = SPARKLINE_MAX_POINTS
): ActivityStream {
  const n = stream.time.length
  if (n <= maxPoints) return stream
  const step = (n - 1) / (maxPoints - 1)
  const pick = (arr: number[]) => {
    const out: number[] = []
    for (let i = 0; i < maxPoints; i++) out.push(arr[Math.round(i * step)] ?? 0)
    return out
  }
  return {
    heartrate: pick(stream.heartrate),
    distance: pick(stream.distance),
    time: pick(stream.time),
  }
}

export function aggregateActivities(
  activities: Activity[],
  mode: AggregationMode = "weekly",
): ChartDataPoint[] {
  const map = new Map<string, number>()

  for (const a of activities) {
    const d = new Date(a.date + "T00:00:00")
    let key: string
    if (mode === "daily") {
      key = a.date
    } else if (mode === "monthly") {
      key = format(startOfMonth(d), "yyyy-MM-dd")
    } else {
      key = format(startOfWeek(d, { weekStartsOn: 0 }), "yyyy-MM-dd")
    }
    const existing = map.get(key) ?? 0
    map.set(key, existing + a.distance_miles)
  }

  const labelFormat =
    mode === "monthly" ? "MMM ''yy" : "MMM d, ''yy"

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, miles]) => ({
      date,
      label: format(new Date(date + "T00:00:00"), labelFormat),
      miles: parseFloat(miles.toFixed(1)),
    }))
}

export function fillWeeklyByRange(
  activities: Activity[],
  range: { from?: Date; to?: Date } | undefined
): ChartDataPoint[] {
  const buckets = buildWeeklyByRange(activities, range)
  return buckets.map((b) => ({
    date: b.date,
    label: format(new Date(b.date + "T00:00:00"), "MMM d"),
    miles: b.miles ?? 0,
  }))
}
