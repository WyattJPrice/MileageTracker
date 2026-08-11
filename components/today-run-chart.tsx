"use client"

import { useMemo } from "react"
import { ComposedChart, Line, ReferenceDot, ResponsiveContainer, XAxis, YAxis } from "recharts"
import type { ActivityStream } from "@/lib/types"

const HR_COLOR = "#f87171"
const PACE_COLOR = "#4ade80"

interface TodayRunChartProps {
  stream: ActivityStream
  maxHeartrate?: number | null
}

interface Point {
  mi: number
  min: number
  hr: number | null
  pace: number | null
}

function smooth(arr: (number | null)[], window: number): (number | null)[] {
  return arr.map((_, i) => {
    let sum = 0
    let count = 0
    for (let j = Math.max(0, i - window); j <= Math.min(arr.length - 1, i + window); j++) {
      if (arr[j] != null) {
        sum += arr[j] as number
        count++
      }
    }
    return count > 0 ? sum / count : null
  })
}

export function TodayRunChart({ stream, maxHeartrate }: TodayRunChartProps) {
  const data = useMemo<Point[]>(() => {
    const n = stream.time.length
    const points: Point[] = []
    for (let i = 0; i < n; i++) {
      points.push({
        mi: stream.distance[i] * 0.000621371,
        min: stream.time[i] / 60,
        hr: stream.heartrate[i] > 0 ? stream.heartrate[i] : null,
        pace: null,
      })
    }

    const rawPace: (number | null)[] = points.map((_, i) => {
      if (i === 0) return null
      const dt = stream.time[i] - stream.time[i - 1]
      const dd = stream.distance[i] - stream.distance[i - 1]
      if (dt <= 0 || dd <= 0) return null
      const mi = dd * 0.000621371
      return (dt / 60) / mi
    })
    const avgPace = smooth(rawPace, 3)
    for (let i = 0; i < n; i++) points[i].pace = avgPace[i] != null ? -avgPace[i]! : null
    return points
  }, [stream])

  const stats = useMemo(() => {
    const peak = maxHeartrate && maxHeartrate > 0 ? maxHeartrate : 0
    let peakIdx = -1
    let streamPeak = 0
    data.forEach((d, i) => {
      if (d.hr != null && d.hr > streamPeak) {
        streamPeak = d.hr
        peakIdx = i
      }
    })
    return { peak, peakMi: peakIdx >= 0 ? data[peakIdx].mi : 0 }
  }, [data, maxHeartrate])

  const maxHr = Math.max(
    ...data.map((d) => d.hr ?? 0),
    stats.peak ?? 0,
    0
  ) + 10
  const minHr = data.some((d) => d.hr != null)
    ? Math.max(0, Math.min(...data.map((d) => d.hr ?? Infinity)) - 10)
    : 100

  const maxMile = data.length > 0 ? data[data.length - 1].mi : 0
  const mileTicks = Array.from({ length: Math.floor(maxMile) + 1 }, (_, i) => i)

  if (data.length < 2) return null

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wider text-zinc-500">
          Heart Rate & Pace
        </p>
      </div>
      <div className="h-40 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ left: 10, right: 10, top: 18, bottom: 28 }}
          >
          <XAxis
            dataKey="mi"
            type="number"
            domain={[0, maxMile]}
            ticks={mileTicks}
            tickFormatter={(v: number) => `${v}mi`}
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 10 }}
          />
          <YAxis
            yAxisId="hr"
            hide
            domain={[minHr, maxHr]}
          />

          {stats.peak > 0 && (
            <ReferenceDot
              yAxisId="hr"
              x={stats.peakMi}
              y={stats.peak}
              r={4}
              fill={HR_COLOR}
              stroke="var(--color-background)"
              strokeWidth={1.5}
              label={{
                value: `${stats.peak}`,
                position: "top",
                fontSize: 10,
                fill: HR_COLOR,
                fontWeight: 600,
              }}
            />
          )}

          <Line
            yAxisId="hr"
            dataKey="hr"
            type="monotone"
            stroke={HR_COLOR}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
          <Line
            yAxisId="pace"
            dataKey="pace"
            type="monotone"
            stroke={PACE_COLOR}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}