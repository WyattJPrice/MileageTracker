"use client"

import * as React from "react"
import { format } from "date-fns"
import { MileageChart } from "@/components/mileage-chart"
import type { ChartDataPoint, HighlightRange } from "@/lib/types"

const DAY_MS = 86_400_000
const MIN_RANGE_MS = DAY_MS * 14
const DAILY_THRESHOLD_MS = DAY_MS * 56

const toMs = (d: string) => new Date(d + "T00:00:00").getTime()
const toDate = (ms: number) => format(new Date(ms), "yyyy-MM-dd")

interface ZoomableChartProps {
  weeklyData: ChartDataPoint[]
  dailyData: ChartDataPoint[]
  weeklyHighlights?: HighlightRange[]
  dailyHighlights?: HighlightRange[]
  isLoading?: boolean
  onViewChange?: (state: { isZoomed: boolean; isDaily: boolean; reset: () => void }) => void
}

export function ZoomableChart({
  weeklyData,
  dailyData,
  weeklyHighlights,
  dailyHighlights,
  isLoading,
  onViewChange,
}: ZoomableChartProps) {
  const [viewStart, setViewStart] = React.useState(0)
  const [viewEnd, setViewEnd] = React.useState(0)
  const [isDragging, setIsDragging] = React.useState(false)
  const [isScrollDragging, setIsScrollDragging] = React.useState(false)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const trackRef = React.useRef<HTMLDivElement>(null)
  const dragRef = React.useRef({ startX: 0, startStart: 0, startEnd: 0 })
  const scrollDragRef = React.useRef({ startX: 0, startStart: 0, startEnd: 0 })
  const hasInteracted = React.useRef(false)

  const data = weeklyData
  const fullStart = data.length > 0 ? toMs(data[0].date) : 0
  const fullEnd = data.length > 0 ? toMs(data[data.length - 1].date) + 6 * DAY_MS : 0
  const fullRange = fullEnd - fullStart

  React.useEffect(() => {
    if (data.length > 0) {
      setViewStart(fullStart)
      setViewEnd(fullEnd)
    }
  }, [fullStart, fullEnd, data.length])

  const viewRange = viewEnd - viewStart
  const isZoomed = viewStart > fullStart || viewEnd < fullEnd
  const useDaily = viewRange <= DAILY_THRESHOLD_MS && viewRange > 0

  const visibleSlice = React.useMemo(() => {
    if (data.length === 0) return []
    const startStr = toDate(viewStart)
    const endStr = toDate(viewEnd)

    if (useDaily) {
      return dailyData.filter((d) => d.date >= startStr && d.date <= endStr)
    }
    return data.filter((d) => {
      const dMs = toMs(d.date)
      return dMs >= viewStart - 6 * DAY_MS && dMs <= viewEnd
    })
  }, [data, dailyData, viewStart, viewEnd, useDaily])

  const visibleHighlights = React.useMemo(() => {
    const highlights = useDaily ? dailyHighlights : weeklyHighlights
    if (!highlights || visibleSlice.length === 0) return []

    const firstDate = visibleSlice[0].date
    const lastDate = visibleSlice[visibleSlice.length - 1].date
    const visibleLabels = new Set(visibleSlice.map((d) => d.label))
    const src = useDaily ? dailyData : data

    return highlights
      .map((h) => {
        const hStart = src.find((d) => d.label === h.x1)
        const hEnd = src.find((d) => d.label === h.x2)
        if (!hStart || !hEnd) return null
        if (hEnd.date < firstDate || hStart.date > lastDate) return null

        const clippedX1 = hStart.date < firstDate ? visibleSlice[0].label : h.x1
        const clippedX2 = hEnd.date > lastDate ? visibleSlice[visibleSlice.length - 1].label : h.x2

        if (!visibleLabels.has(clippedX1) || !visibleLabels.has(clippedX2)) return null
        return { ...h, x1: clippedX1, x2: clippedX2 }
      })
      .filter((h): h is HighlightRange => h !== null)
  }, [weeklyHighlights, dailyHighlights, visibleSlice, data, dailyData, useDaily])

  const clampView = (ns: number, ne: number) => {
    if (ns < fullStart) { ne += fullStart - ns; ns = fullStart }
    if (ne > fullEnd) { ns -= ne - fullEnd; ne = fullEnd }
    setViewStart(Math.max(fullStart, ns))
    setViewEnd(Math.min(fullEnd, ne))
  }

  const zoom = React.useCallback(
    (e: WheelEvent) => {
      e.preventDefault()
      hasInteracted.current = true
      const container = containerRef.current
      if (!container || fullRange === 0) return

      const rect = container.getBoundingClientRect()
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))

      const factor = e.deltaY > 0 ? 1.15 : 0.85
      let nextRange = viewRange * factor
      if (Math.abs(nextRange - viewRange) < DAY_MS) {
        nextRange += (e.deltaY > 0 ? 1 : -1) * DAY_MS
      }
      nextRange = Math.max(MIN_RANGE_MS, Math.min(fullRange, nextRange))

      const delta = viewRange - nextRange
      const left = delta * ratio
      const right = delta - left

      clampView(viewStart + left, viewEnd - right)
    },
    [viewStart, viewEnd, viewRange, fullStart, fullEnd, fullRange]
  )

  const handleMouseDown = React.useCallback(
    (e: React.MouseEvent) => {
      if (e.button !== 0) return
      hasInteracted.current = true
      setIsDragging(true)
      dragRef.current = { startX: e.clientX, startStart: viewStart, startEnd: viewEnd }
    },
    [viewStart, viewEnd]
  )

  const handleMouseMove = React.useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || !containerRef.current) return
      const rect = containerRef.current.getBoundingClientRect()
      const px = dragRef.current.startX - e.clientX
      const dragRange = dragRef.current.startEnd - dragRef.current.startStart
      const deltaMs = (px / rect.width) * dragRange

      const ns = dragRef.current.startStart + deltaMs
      const ne = dragRef.current.startEnd + deltaMs
      clampView(ns, ne)
    },
    [isDragging, fullStart, fullEnd]
  )

  React.useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener("wheel", zoom, { passive: false })
    return () => el.removeEventListener("wheel", zoom)
  }, [zoom])

  React.useEffect(() => {
    const up = () => {
      setIsDragging(false)
      setIsScrollDragging(false)
    }
    window.addEventListener("mouseup", up)
    return () => window.removeEventListener("mouseup", up)
  }, [])

  React.useEffect(() => {
    if (!isScrollDragging) return

    const handleMove = (e: MouseEvent) => {
      if (!trackRef.current) return
      const trackWidth = trackRef.current.getBoundingClientRect().width
      const px = e.clientX - scrollDragRef.current.startX
      const deltaMs = (px / trackWidth) * fullRange
      const range = scrollDragRef.current.startEnd - scrollDragRef.current.startStart

      const ns = scrollDragRef.current.startStart + deltaMs
      clampView(ns, ns + range)
    }

    const handleUp = () => setIsScrollDragging(false)

    window.addEventListener("mousemove", handleMove)
    window.addEventListener("mouseup", handleUp)
    return () => {
      window.removeEventListener("mousemove", handleMove)
      window.removeEventListener("mouseup", handleUp)
    }
  }, [isScrollDragging, fullRange, fullStart, fullEnd])

  const handleScrollThumbDown = (e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    hasInteracted.current = true
    setIsScrollDragging(true)
    scrollDragRef.current = { startX: e.clientX, startStart: viewStart, startEnd: viewEnd }
  }

  const handleTrackClick = (e: React.MouseEvent) => {
    if (!trackRef.current) return
    hasInteracted.current = true
    const rect = trackRef.current.getBoundingClientRect()
    const ratio = (e.clientX - rect.left) / rect.width
    const centerMs = fullStart + ratio * fullRange
    const ns = centerMs - viewRange / 2
    clampView(ns, ns + viewRange)
  }

  const reset = React.useCallback(() => {
    setViewStart(fullStart)
    setViewEnd(fullEnd)
  }, [fullStart, fullEnd])

  React.useEffect(() => {
    onViewChange?.({ isZoomed, isDaily: useDaily, reset })
  }, [isZoomed, useDaily, reset, onViewChange])

  const thumbLeft = fullRange > 0 ? ((viewStart - fullStart) / fullRange) * 100 : 0
  const thumbWidth = fullRange > 0 ? (viewRange / fullRange) * 100 : 100

  return (
    <div className="relative">
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
          className="h-[calc(100dvh-17rem)]"
          animate={!hasInteracted.current}
          lineType="linear"
        />
      </div>
      <div className="relative mx-3 mt-2">
        {isScrollDragging && (
          <div
            className="absolute -top-7 -translate-x-1/2 rounded bg-zinc-800 px-2 py-0.5 text-[11px] tabular-nums text-zinc-300 whitespace-nowrap"
            style={{ left: `${thumbLeft + thumbWidth / 2}%` }}
          >
            {format(new Date(viewStart), "MMM d, ''yy")} – {format(new Date(viewEnd), "MMM d, ''yy")}
          </div>
        )}
        <div
          ref={trackRef}
          className="h-1.5 cursor-pointer rounded-full bg-zinc-800/60"
          onMouseDown={handleTrackClick}
        >
          <div
            className="h-full rounded-full bg-zinc-600 transition-colors hover:bg-zinc-500"
            style={{
              marginLeft: `${thumbLeft}%`,
              width: `${thumbWidth}%`,
              cursor: isScrollDragging ? "grabbing" : "grab",
            }}
            onMouseDown={handleScrollThumbDown}
          />
        </div>
      </div>
    </div>
  )
}
