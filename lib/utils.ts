import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { startOfWeek, format } from "date-fns"
import type { Activity, ChartDataPoint } from "@/lib/types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function aggregateActivities(
  activities: Activity[],
): ChartDataPoint[] {
  const map = new Map<string, number>()

  for (const a of activities) {
    const weekStart = startOfWeek(new Date(a.date + "T00:00:00"), {
      weekStartsOn: 0,
    })
    const key = format(weekStart, "yyyy-MM-dd")
    const existing = map.get(key) ?? 0
    map.set(key, existing + a.distance_miles)
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([weekStart, miles]) => ({
      date: weekStart,
      label: format(new Date(weekStart + "T00:00:00"), "MMM d, ''yy"),
      miles: parseFloat(miles.toFixed(1)),
    }))
}
