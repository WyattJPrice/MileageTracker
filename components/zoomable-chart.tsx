"use client"

import * as React from "react"
import { addDays, format } from "date-fns"
import { RotateCcw } from "lucide-react"
import { MileageChart } from "@/components/mileage-chart"
import type { ChartDataPoint, HighlightRange } from "@/lib/types"

const MIN_VISIBLE = 2
const DAILY_THRESHOLD = 8

interface ZoomableChartProps {
  weeklyData: ChartDataPoint[]
  dailyData: ChartDataPoint[]
  weeklyHighlights?: HighlightRange[]
  dailyHighlights?: HighlightRange[]
  isLoading?: boolean
}

export function ZoomableChart({
  weeklyData,
  dailyData,
  weeklyHighlights,
  dailyHighlights,
  isLoading,
}: ZoomableChartProps) {
  const [startIdx, setStartIdx] = React.useState(0)
  const [endIdx, setEndIdx] = React.useState(0)
  const [isDragging, setIsDragging] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const dragRef = React.useRef({ startX: 0, startStart: 0, startEnd: 0 })
  const hasInteracted = React.useRef(false)

  const data = weeklyData
  const len = data.length

  React.useEffect(() => {
    setStartIdx(0)
    setEndIdx(len)
  }, [len])

  const isZoomed = startIdx > 0 || endIdx < len
  const visibleWeekCount = endIdx - startIdx

  const useDaily = visibleWeekCount <= DAILY_THRESHOLD && visibleWeekCount > 0

  const visibleSlice = React.useMemo(() => {
    if (!useDaily) return data.slice(startIdx, endIdx)

    const startDate = data[startIdx]?.date
    const endWeekStart = data[Math.max(0, endIdx - 1)]?.date
    if (!startDate || !endWeekStart) return data.slice(startIdx, endIdx)

    const endDate = format(addDays(new Date(endWeekStart + "T00:00:00"), 6), "yyyy-MM-dd")
    return dailyData.filter((d) => d.date >= startDate && d.date <= endDate)
  }, [data, dailyData, startIdx, endIdx, useDaily])

  const visibleHighlights = React.useMemo(() => {
    const highlights = useDaily ? dailyHighlights : weeklyHighlights
    if (!highlights || visibleSlice.length === 0) return []

    const firstDate = visibleSlice[0].date
    const lastDate = visibleSlice[visibleSlice.length - 1].date
    const visibleLabels = new Set(visibleSlice.map((d) => d.label))

    if (useDaily) {
      return highlights
        .map((h) => {
          const src = dailyData
          const origStartIdx = src.findIndex((d) => d.label === h.x1)
          const origEndIdx = src.findIndex((d) => d.label === h.x2)
          const origStartDate = src[origStartIdx]?.date
          const origEndDate = src[origEndIdx]?.date
          if (!origStartDate || !origEndDate) return null
          if (origEndDate < firstDate || origStartDate > lastDate) return null

          const clippedStart = origStartDate < firstDate ? visibleSlice[0].label : h.x1
          const clippedEnd = origEndDate > lastDate ? visibleSlice[visibleSlice.length - 1].label : h.x2

          if (!visibleLabels.has(clippedStart) || !visibleLabels.has(clippedEnd)) return null
          return { ...h, x1: clippedStart, x2: clippedEnd }
        })
        .filter((h): h is HighlightRange => h !== null)
    }

    return highlights
      .map((h) => {
        const hStartDate = data.find((d) => d.label === h.x1)?.date
        const hEndDate = data.find((d) => d.label === h.x2)?.date
        if (!hStartDate || !hEndDate) return null
        if (hEndDate < firstDate || hStartDate > lastDate) return null

        const clippedX1 = hStartDate < firstDate ? visibleSlice[0].label : h.x1
        const clippedX2 = hEndDate > lastDate ? visibleSlice[visibleSlice.length - 1].label : h.x2

        if (!visibleLabels.has(clippedX1) || !visibleLabels.has(clippedX2)) return null
        return { ...h, x1: clippedX1, x2: clippedX2 }
      })
      .filter((h): h is HighlightRange => h !== null)
  }, [weeklyHighlights, dailyHighlights, visibleSlice, data, dailyData, startIdx, endIdx, useDaily])

  const zoom = React.useCallback(
    (e: WheelEvent) => {
      e.preventDefault()
      hasInteracted.current = true
      const container = containerRef.current
      if (!container || len === 0) return

      const rect = container.getBoundingClientRect()
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))

      const range = endIdx - startIdx
      const factor = e.deltaY > 0 ? 1.15 : 0.85
      let next = Math.round(range * factor)
      if (next === range) next += e.deltaY > 0 ? 1 : -1
      next = Math.max(MIN_VISIBLE, Math.min(len, next))

      const delta = range - next
      const left = Math.round(delta * ratio)
      const right = delta - left

      let ns = startIdx + left
      let ne = endIdx - right

      if (ns < 0) { ne -= ns; ns = 0 }
      if (ne > len) { ns -= ne - len; ne = len }
      ns = Math.max(0, ns)
      ne = Math.min(len, ne)

      if (ne - ns >= MIN_VISIBLE) {
        setStartIdx(ns)
        setEndIdx(ne)
      }
    },
    [len, startIdx, endIdx]
  )

  const handleMouseDown = React.useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return
      hasInteracted.current = true
      setIsDragging(true)
      dragRef.current = { startX: e.clientX, startStart: startIdx, startEnd: endIdx }
    },
    [startIdx, endIdx]
  )

  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const px = dragRef.current.startX - e.clientX
      const range = dragRef.current.startEnd - dragRef.current.startStart
      const delta = Math.round((px / rect.width) * range)

      let ns = dragRef.current.startStart + delta
      let ne = dragRef.current.startEnd + delta

      if (ns < 0) { ne -= ns; ns = 0 }
      if (ne > len) { ns -= ne - len; ne = len }

      setStartIdx(Math.max(0, ns))
      setEndIdx(Math.min(len, ne))
    },
    [isDragging, len]
  )

  React.useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener("wheel", zoom, { passive: false })
    return () => el.removeEventListener("wheel", zoom)
  }, [zoom])

  React.useEffect(() => {
    const up = () => setIsDragging(false)
    window.addEventListener("mouseup", up)
    return () => window.removeEventListener("mouseup", up)
  }, [])

  const reset = () => {
    setStartIdx(0)
    setEndIdx(len)
  }

  return (
    <div className="relative">
      {isZoomed && (
        <button
          onClick={reset}
          className="absolute right-2 top-2 z-10 flex items-center gap-1.5 rounded-md bg-zinc-800/80 px-2.5 py-1 text-xs text-zinc-400 backdrop-blur transition-colors hover:text-zinc-200"
        >
          <RotateCcw className="h-3 w-3" />
          Reset
        </button>
      )}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={() => setIsDragging(false)}
        className="zoomable-chart-container select-none"
        style={{ cursor: isDragging ? "grabbing" : "grab" }}
      >
        <MileageChart
          data={visibleSlice}
          highlights={visibleHighlights}
          isLoading={isLoading}
          className="h-[70vh]"
          animate={!hasInteracted.current}
        />
      </div>
    </div>
  )
}
