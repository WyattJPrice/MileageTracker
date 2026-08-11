"use client"

import { useMemo } from "react"
import { ComposedChart, Line, ReferenceDot, ResponsiveContainer, XAxis, YAxis } from "recharts"
import type { ActivityStream } from "@/lib/types"

const HR_COLOR = "#00d69b"
const PACE_COLOR = "#71717a"

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

  const maxMile = data.length > 0 ? data[data.length - 1].mi : 0
  const mileTicks = Array.from({ length: Math.floor(maxMile) + 1 }, (_, i) => i)

  if (data.length < 2) return null

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart
          data={data}
          margin={{ left: 4, right: 10, top: 18, bottom: 0 }}
        >
          <XAxis
            dataKey="mi"
            type="number"
            domain={[0, maxMile]}
            ticks={mileTicks}
            tickFormatter={(v: number) => `${v}mi`}
            tickLine={false}
            axisLine={false}
            tickMargin={6}
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 9 }}
          />
          <YAxis
            yAxisId="hr"
            domain={[80, 190]}
            ticks={[90, 120, 150, 180]}
            tickLine={false}
            axisLine={false}
            width={24}
            tickMargin={2}
            tick={{ fill: "var(--color-muted-foreground)", fontSize: 9 }}
          />
          <YAxis yAxisId="pace" hide domain={["auto", "auto"]} />

          {stats.peak > 0 && (
            <ReferenceDot
              yAxisId="hr"
              x={stats.peakMi}
              y={stats.peak}
              r={3.5}
              fill={HR_COLOR}
              stroke="#18181b"
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
            strokeWidth={1.25}
            strokeOpacity={0.6}
            dot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  )
}