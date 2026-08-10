"use client"

import * as React from "react"
import { format, addDays } from "date-fns"
import type { DateRange } from "react-day-picker"
import { SlidersHorizontal, X } from "lucide-react"
import { DateRangePicker } from "@/components/date-range-picker"
import { MileageChart } from "@/components/mileage-chart"
import { ComparisonChart, type ComparisonHighlight, type ComparisonSeries } from "@/components/comparison-chart"
import { aggregateActivities, buildWeeklyByRange, weekOfYear } from "@/lib/utils"
import { seasons, TRACK_COLOR, XC_COLOR } from "@/lib/seasons"
import { SERIES_COLORS } from "@/lib/presets"
import { usePresets } from "@/lib/use-presets"
import { rangeName } from "@/lib/presets"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import type { Activity, ChartDataPoint, HighlightRange, Race } from "@/lib/types"

interface ChartPanelProps {
  ranges: (DateRange | undefined)[]
  onRangesChange: (ranges: (DateRange | undefined)[]) => void
  large?: boolean
}

function rangeKey(range: DateRange | undefined): string | null {
  if (!range?.from || !range?.to) return null
  return `${format(range.from, "yyyy-MM-dd")}..${format(range.to, "yyyy-MM-dd")}`
}

export function ChartPanel({
  ranges,
  onRangesChange,
  large = false,
}: ChartPanelProps) {
  const { presets } = usePresets()
  const [races, setRaces] = React.useState<Race[]>([])
  const [loadKey, setLoadKey] = React.useState("")
  const [activitiesByRange, setActivitiesByRange] = React.useState<
    (Activity[] | null)[]
  >([])
  const [showTrack, setShowTrack] = React.useState(false)
  const [showXC, setShowXC] = React.useState(false)

  const isCompare = ranges.length > 1

  React.useEffect(() => {
    fetch("/api/races")
      .then((r) => r.json())
      .then((d) => setRaces(d))
      .catch(() => {})
  }, [])

  const keys = ranges.map(rangeKey).join("|")
  const isLoading = loadKey !== keys

  React.useEffect(() => {
    const controllers = ranges.map(() => new AbortController())
    let active = true

    Promise.all(
      ranges.map((range, i) => {
        if (!range?.from || !range?.to) return Promise.resolve(null)
        const start = format(range.from, "yyyy-MM-dd")
        const end = format(range.to, "yyyy-MM-dd")
        return fetch(`/api/activities?start=${start}&end=${end}`, {
          signal: controllers[i].signal,
        })
          .then((res) => res.json())
          .catch((err) => {
            if (err.name !== "AbortError") return null
            throw err
          })
      })
    )
      .then((results) => {
        if (!active) return
        const sortedResults = results.map((res, i) =>
          res && ranges[i]?.from && ranges[i]?.to ? res : null
        )
        setActivitiesByRange(sortedResults as (Activity[] | null)[])
        setLoadKey(keys)
      })
      .catch((err) => {
        if (!active || err.name === "AbortError") return
        setActivitiesByRange(ranges.map(() => null))
        setLoadKey(keys)
      })

    return () => {
      active = false
      controllers.forEach((c) => c.abort())
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [keys])

  const singleActivities: Activity[] = React.useMemo(
    () => activitiesByRange[0] ?? [],
    [activitiesByRange]
  )

  const chartData: ChartDataPoint[] = React.useMemo(() => {
    if (isCompare || singleActivities.length === 0) return []
    const points = aggregateActivities(singleActivities)
    for (const point of points) {
      const weekEnd = format(
        addDays(new Date(point.date + "T00:00:00"), 6),
        "yyyy-MM-dd"
      )
      const matched = races.filter(
        (r) => r.date >= point.date && r.date <= weekEnd
      )
      if (matched.length > 0) point.races = matched
    }
    return points
  }, [isCompare, singleActivities, races])

  const highlights: HighlightRange[] = React.useMemo(() => {
    if (isCompare || (!showTrack && !showXC)) return []
    if (chartData.length === 0) return []

    const ranges: HighlightRange[] = []

    for (const season of seasons) {
      if (season.type === "track" && !showTrack) continue
      if (season.type === "xc" && !showXC) continue

      const matching = chartData.filter((d) => {
        const weekEnd = format(
          addDays(new Date(d.date + "T00:00:00"), 6),
          "yyyy-MM-dd"
        )
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
  }, [isCompare, chartData, showTrack, showXC])

  const comparisonSeries: ComparisonSeries[] = React.useMemo(() => {
    if (!isCompare) return []
    return ranges.map((range, i) => {
      const activities = activitiesByRange[i] ?? []
      const data = buildWeeklyByRange(activities, range).map((point) => {
        const weekEnd = format(
          addDays(new Date(point.date + "T00:00:00"), 6),
          "yyyy-MM-dd"
        )
        return {
          ...point,
          races: races.filter(
            (r) => r.date >= point.date && r.date <= weekEnd
          ),
        }
      })
      return {
        key: `series-${i}`,
        label:
          rangeName(range, presets) ??
          (range?.from && range?.to
            ? `${format(range.from, "MMM d, yy")} – ${format(range.to, "MMM d, yy")}`
            : "Unset range"),
        color: SERIES_COLORS[i % SERIES_COLORS.length],
        data,
      }
    })
  }, [isCompare, ranges, activitiesByRange, presets, races])

  const comparisonHighlights: ComparisonHighlight[] = React.useMemo(() => {
    if (!isCompare || (!showTrack && !showXC)) return []

    const seriesWeeks = new Set(
      comparisonSeries.flatMap((s) => s.data.map((d) => d.week))
    )
    if (seriesWeeks.size === 0) return []

    const ranges: ComparisonHighlight[] = []

    for (const season of seasons) {
      if (season.type === "track" && !showTrack) continue
      if (season.type === "xc" && !showXC) continue

      const fromWeek = weekOfYear(new Date(season.from + "T00:00:00"))
      const toWeek = weekOfYear(new Date(season.to + "T00:00:00"))

      const minWeek = Math.min(...seriesWeeks)
      const maxWeek = Math.max(...seriesWeeks)
      const x1 = Math.max(fromWeek, minWeek)
      const x2 = Math.min(toWeek, maxWeek)

      if (x1 > x2) continue
      const hasOverlap = Array.from({ length: x2 - x1 + 1 }, (_, i) => x1 + i).some(
        (w) => seriesWeeks.has(w)
      )
      if (!hasOverlap) continue

      ranges.push({
        x1,
        x2,
        color: season.type === "track" ? TRACK_COLOR : XC_COLOR,
      })
    }

    return ranges
  }, [isCompare, comparisonSeries, showTrack, showXC])

  const updateRange = (index: number, range: DateRange | undefined) => {
    const next = [...ranges]
    next[index] = range
    onRangesChange(next)
  }

  const removeRange = (index: number) => {
    onRangesChange(ranges.filter((_, i) => i !== index))
  }

  const totalMiles = isCompare
    ? activitiesByRange.reduce(
        (sum, acts) => sum + (acts?.reduce((s, a) => s + a.distance_miles, 0) ?? 0),
        0
      )
    : singleActivities.reduce((sum, a) => sum + a.distance_miles, 0)
  const totalRuns = isCompare
    ? activitiesByRange.reduce((sum, acts) => sum + (acts?.length ?? 0), 0)
    : singleActivities.length

  const filtersActive = showTrack || showXC

  const chartHeight = large
    ? "h-[calc(100dvh-17rem)]"
    : "h-[280px]"

  return (
    <div className="group/panel">
      <div className="flex items-center justify-between gap-2">
        {isCompare ? (
          <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
            {comparisonSeries.map((s, i) => {
              const total = activitiesByRange[i]?.reduce(
                (sum, a) => sum + a.distance_miles,
                0
              ) ?? 0
              return (
                <div
                  key={s.key}
                  className="flex items-center gap-1.5 rounded-md bg-zinc-900/60 py-1 pl-1.5 pr-1"
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-sm"
                    style={{ backgroundColor: s.color }}
                  />
                  <DateRangePicker
                    dateRange={ranges[i]}
                    onDateRangeChange={(r) => updateRange(i, r)}
                    compact
                  />
                  <span className="font-mono text-xs tabular-nums text-zinc-200">
                    {total.toFixed(1)} mi
                  </span>
                  {ranges.length > 1 && (
                    <button
                      onClick={() => removeRange(i)}
                      className="rounded p-0.5 text-zinc-600 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-lg tabular-nums text-zinc-100">
              {totalMiles.toFixed(1)} mi
            </span>
            <span className="text-xs text-zinc-500">
              across {totalRuns} runs
            </span>
          </div>
        )}

        <div className="flex shrink-0 items-center gap-1">
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
                      showTrack ? "border-amber-500 bg-amber-500/20" : "border-zinc-700"
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
                      showXC ? "border-blue-500 bg-blue-500/20" : "border-zinc-700"
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

          {!isCompare && (
            <DateRangePicker
              dateRange={ranges[0]}
              onDateRangeChange={(r) => updateRange(0, r)}
            />
          )}
        </div>
      </div>

      <div className="mt-3 border-t border-zinc-800 pt-4">
        {isCompare ? (
          <ComparisonChart
            series={comparisonSeries}
            highlights={comparisonHighlights}
            isLoading={isLoading}
            className={chartHeight}
          />
        ) : (
          <MileageChart
            data={chartData}
            highlights={highlights}
            isLoading={isLoading}
            className={chartHeight}
          />
        )}
      </div>
    </div>
  )
}