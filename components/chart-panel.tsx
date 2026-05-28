"use client"

import * as React from "react"
import { format, addDays } from "date-fns"
import type { DateRange } from "react-day-picker"
import { SlidersHorizontal, X } from "lucide-react"
import { DateRangePicker } from "@/components/date-range-picker"
import { MileageChart } from "@/components/mileage-chart"
import { aggregateActivities } from "@/lib/utils"
import { seasons, TRACK_COLOR, XC_COLOR } from "@/lib/seasons"
import { races } from "@/lib/races"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { Activity, ChartDataPoint, HighlightRange } from "@/lib/types"

interface ChartPanelProps {
  dateRange: DateRange | undefined
  onDateRangeChange: (range: DateRange | undefined) => void
  onRemove?: () => void
}

export function ChartPanel({
  dateRange,
  onDateRangeChange,
  onRemove,
}: ChartPanelProps) {
  const [activities, setActivities] = React.useState<Activity[]>([])
  const [isLoading, setIsLoading] = React.useState(false)
  const [showTrack, setShowTrack] = React.useState(false)
  const [showXC, setShowXC] = React.useState(false)

  React.useEffect(() => {
    if (!dateRange?.from || !dateRange?.to) return

    const controller = new AbortController()
    setIsLoading(true)

    const start = format(dateRange.from, "yyyy-MM-dd")
    const end = format(dateRange.to, "yyyy-MM-dd")

    fetch(`/api/activities?start=${start}&end=${end}`, {
      signal: controller.signal,
    })
      .then((res) => res.json())
      .then((data) => {
        setActivities(data)
        setIsLoading(false)
      })
      .catch((err) => {
        if (err.name !== "AbortError") {
          setIsLoading(false)
        }
      })

    return () => controller.abort()
  }, [dateRange?.from?.getTime(), dateRange?.to?.getTime()])

  const chartData: ChartDataPoint[] = React.useMemo(() => {
    if (activities.length === 0) return []
    const points = aggregateActivities(activities)
    for (const point of points) {
      const weekEnd = format(addDays(new Date(point.date + "T00:00:00"), 6), "yyyy-MM-dd")
      const matched = races.filter(
        (r) => r.date >= point.date && r.date <= weekEnd
      )
      if (matched.length > 0) point.races = matched
    }
    return points
  }, [activities])

  const highlights: HighlightRange[] = React.useMemo(() => {
    if (!showTrack && !showXC) return []
    if (chartData.length === 0) return []

    const ranges: HighlightRange[] = []

    for (const season of seasons) {
      if (season.type === "track" && !showTrack) continue
      if (season.type === "xc" && !showXC) continue

      const matching = chartData.filter((d) => {
        const weekEnd = format(addDays(new Date(d.date + "T00:00:00"), 6), "yyyy-MM-dd")
        return d.date <= season.to && weekEnd >= season.from
      })

      if (matching.length === 0) continue

      ranges.push({
        x1: matching[0].label,
        x2: matching[matching.length - 1].label,
        color: season.type === "track" ? TRACK_COLOR : XC_COLOR,
      })
    }

    return ranges
  }, [chartData, showTrack, showXC])

  const totalMiles = activities.reduce((sum, a) => sum + a.distance_miles, 0)
  const filtersActive = showTrack || showXC

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-baseline gap-2">
          <span className="font-mono text-lg tabular-nums text-zinc-100">
            {totalMiles.toFixed(1)} mi
          </span>
          <span className="text-xs text-zinc-500">
            across {activities.length} runs
          </span>
        </div>

        <div className="flex items-center gap-1">
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

          <DateRangePicker
            dateRange={dateRange}
            onDateRangeChange={onDateRangeChange}
          />
          {onRemove && (
            <button
              onClick={onRemove}
              className="rounded-md p-1 text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-3 border-t border-zinc-800 pt-4">
        <MileageChart
          data={chartData}
          highlights={highlights}
          isLoading={isLoading}
        />
      </div>
    </div>
  )
}
