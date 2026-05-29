"use client"

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  LabelList,
  CartesianGrid,
} from "recharts"
import { ChartContainer, type ChartConfig } from "@/components/ui/chart"
import { aggregateActivities } from "@/lib/utils"
import type { Activity } from "@/lib/types"

const chartConfig = {
  miles: {
    label: "Miles",
    color: "var(--color-emerald)",
  },
} satisfies ChartConfig

interface EightWeekChartProps {
  activities: Activity[]
}

function shortLabel(label: string) {
  return label.replace(/, '.*$/, "")
}

export function EightWeekChart({ activities }: EightWeekChartProps) {
  const data = aggregateActivities(activities, "weekly")

  if (data.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center">
        <p className="text-sm text-zinc-500">No data</p>
      </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} className="h-full w-full">
      <BarChart data={data} margin={{ left: 8, right: 8, top: 24, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="oklch(0.27 0.006 285.82)" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={12}
          stroke="oklch(0.55 0.01 285.82)"
          tickFormatter={shortLabel}
          interval={0}
        />
        <YAxis hide />
        <Bar dataKey="miles" fill="var(--color-miles)" radius={[4, 4, 0, 0]} isAnimationActive={false}>
          <LabelList
            dataKey="miles"
            position="top"
            formatter={(v) => (typeof v === "number" ? v.toFixed(1) : String(v))}
            style={{ fill: "oklch(0.94 0.005 285.82)", fontSize: 12, fontFamily: "var(--font-mono)" }}
          />
        </Bar>
      </BarChart>
    </ChartContainer>
  )
}
