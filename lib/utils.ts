import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { startOfWeek, startOfMonth, format } from "date-fns"
import type { Activity, ChartDataPoint } from "@/lib/types"

export type AggregationMode = "daily" | "weekly" | "monthly"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
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
