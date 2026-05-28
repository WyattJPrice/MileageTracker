"use client"

import * as React from "react"
import { format, addDays } from "date-fns"
import { SlidersHorizontal } from "lucide-react"
import { ZoomableChart } from "@/components/zoomable-chart"
import { aggregateActivities } from "@/lib/utils"
import { seasons, TRACK_COLOR, XC_COLOR } from "@/lib/seasons"
import { races } from "@/lib/races"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { Activity, ChartDataPoint, HighlightRange } from "@/lib/types"

function attachRaces(points: ChartDataPoint[], daySpan: number) {
  for (const point of points) {
    const end = format(addDays(new Date(point.date + "T00:00:00"), daySpan), "yyyy-MM-dd")
    const matched = races.filter(
      (r) => r.date >= point.date && r.date <= end
    )
    if (matched.length > 0) point.races = matched
  }
  return points
}

function computeHighlights(
  chartData: ChartDataPoint[],
  daySpan: number,
  showTrack: boolean,
  showXC: boolean,
): HighlightRange[] {
  if (!showTrack && !showXC) return []
  if (chartData.length === 0) return []

  const ranges: HighlightRange[] = []

  for (const season of seasons) {
    if (season.type === "track" && !showTrack) continue
    if (season.type === "xc" && !showXC) continue

    const matching = chartData.filter((d) => {
      const end = format(addDays(new Date(d.date + "T00:00:00"), daySpan), "yyyy-MM-dd")
      return d.date <= season.to && end >= season.from
    })

    if (matching.length === 0) continue

    ranges.push({
      x1: matching[0].label,
      x2: matching[matching.length - 1].label,
      color: season.type === "track" ? TRACK_COLOR : XC_COLOR,
    })
  }

  return ranges
}

export function OverviewTab() {
  const [activities, setActivities] = React.useState<Activity[]>([])
  const [isLoading, setIsLoading] = React.useState(true)
  const [showTrack, setShowTrack] = React.useState(false)
  const [showXC, setShowXC] = React.useState(false)

  React.useEffect(() => {
    fetch("/api/activities?start=2023-01-01&end=2027-01-01")
      .then((res) => res.json())
      .then((data) => {
        setActivities(data)
        setIsLoading(false)
      })
      .catch(() => setIsLoading(false))
  }, [])

  const weeklyData = React.useMemo(() => {
    if (activities.length === 0) return []
    return attachRaces(aggregateActivities(activities, "weekly"), 6)
  }, [activities])

  const dailyData = React.useMemo(() => {
    if (activities.length === 0) return []
    return attachRaces(aggregateActivities(activities, "daily"), 0)
  }, [activities])

  const weeklyHighlights = React.useMemo(
    () => computeHighlights(weeklyData, 6, showTrack, showXC),
    [weeklyData, showTrack, showXC]
  )

  const dailyHighlights = React.useMemo(
    () => computeHighlights(dailyData, 0, showTrack, showXC),
    [dailyData, showTrack, showXC]
  )

  const totalMiles = activities.reduce((sum, a) => sum + a.distance_miles, 0)
  const filtersActive = showTrack || showXC

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-lg tabular-nums text-zinc-100">
            {totalMiles.toFixed(1)} mi
          </span>
          <span className="text-xs text-zinc-500">
            across {activities.length} runs
          </span>
        </div>

        <Popover>
          <PopoverTrigger
            className={`rounded-md p-1.5 transition-colors ${
              filtersActive
                ? "text-emerald-400"
                : "text-zinc-600 hover:text-zinc-300"
            }`}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
          </PopoverTrigger>
          <PopoverContent
            className="w-44 border-zinc-800 bg-zinc-900 p-2"
            align="end"
          >
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
              Seasons
            </p>
            <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-zinc-800">
              <input
                type="checkbox"
                checked={showTrack}
                onChange={(e) => setShowTrack(e.target.checked)}
                className="sr-only"
              />
              <span
                className={`flex h-3.5 w-3.5 items-center justify-center rounded border transition-colors ${
                  showTrack
                    ? "border-amber-500 bg-amber-500/20"
                    : "border-zinc-700"
                }`}
              >
                {showTrack && (
                  <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 text-amber-400" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 6l3 3 5-5" />
                  </svg>
                )}
              </span>
              Track
            </label>
            <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-zinc-800">
              <input
                type="checkbox"
                checked={showXC}
                onChange={(e) => setShowXC(e.target.checked)}
                className="sr-only"
              />
              <span
                className={`flex h-3.5 w-3.5 items-center justify-center rounded border transition-colors ${
                  showXC
                    ? "border-blue-500 bg-blue-500/20"
                    : "border-zinc-700"
                }`}
              >
                {showXC && (
                  <svg viewBox="0 0 12 12" className="h-2.5 w-2.5 text-blue-400" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M2 6l3 3 5-5" />
                  </svg>
                )}
              </span>
              Cross Country
            </label>
          </PopoverContent>
        </Popover>
      </div>

      <div className="border-t border-zinc-800 pt-4">
        <ZoomableChart
          weeklyData={weeklyData}
          dailyData={dailyData}
          weeklyHighlights={weeklyHighlights}
          dailyHighlights={dailyHighlights}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
