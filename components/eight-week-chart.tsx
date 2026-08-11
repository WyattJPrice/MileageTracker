"use client"

import { startOfWeek, subWeeks } from "date-fns"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  LabelList,
  ResponsiveContainer,
} from "recharts"
import { fillWeeklyByRange } from "@/lib/utils"
import type { Activity } from "@/lib/types"

const NEON = "#00d69b"

interface EightWeekChartProps {
  activities: Activity[]
}

export function EightWeekChart({ activities }: EightWeekChartProps) {
  const now = new Date()
  const range = {
    from: subWeeks(startOfWeek(now, { weekStartsOn: 0 }), 7),
    to: now,
  }
  const data = fillWeeklyByRange(activities, range)

  if (data.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm text-zinc-500">No data</p>
      </div>
    )
  }

  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ left: 0, right: 16, top: 28, bottom: 0 }}>
          <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="oklch(0.27 0.006 285.82)" />
          <XAxis
            dataKey="label"
            tickLine={false}
            axisLine={false}
            tickMargin={8}
            interval={0}
            tick={{ fill: "oklch(0.55 0.01 285.82)", fontSize: 10 }}
          />
          <YAxis
            domain={[0, 70]}
            ticks={[0, 10, 20, 30, 40, 50, 60, 70]}
            tickLine={false}
            axisLine={false}
            width={52}
            tickMargin={18}
            tick={{ fill: "oklch(0.45 0.01 285.82)", fontSize: 9 }}
          />
          <Line
            dataKey="miles"
            type="linear"
            stroke={NEON}
            strokeWidth={3.5}
            dot={{ r: 4, fill: NEON, stroke: "none" }}
            isAnimationActive={false}
          >
            <LabelList
              dataKey="miles"
              position="top"
              offset={14}
              formatter={(v) => (typeof v === "number" ? v.toFixed(1) : String(v))}
              style={{ fill: "oklch(0.94 0.005 285.82)", fontSize: 16, fontFamily: "var(--font-mono)" }}
            />
          </Line>
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}