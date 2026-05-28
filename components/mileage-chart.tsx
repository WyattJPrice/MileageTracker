"use client"

import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts"
import {
  ChartContainer,
  type ChartConfig,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import type { ChartDataPoint, HighlightRange, Race } from "@/lib/types"

const chartConfig = {
  miles: {
    label: "Miles",
    color: "var(--color-emerald)",
  },
} satisfies ChartConfig

function ChartSkeleton() {
  return (
    <div className="flex h-[280px] w-full flex-col gap-3 p-4">
      <div className="flex items-end gap-2 h-full">
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1 rounded-sm bg-zinc-800"
            style={{ height: `${30 + Math.sin(i * 0.8) * 25 + 15}%` }}
          />
        ))}
      </div>
      <Skeleton className="h-4 w-full bg-zinc-800" />
    </div>
  )
}

function RaceDot(props: Record<string, unknown>) {
  const { cx, cy, payload } = props as { cx: number; cy: number; payload: ChartDataPoint }
  if (!payload.races || payload.races.length === 0) return null
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill="var(--color-emerald)"
      stroke="oklch(0.098 0.005 285.82)"
      strokeWidth={2}
    />
  )
}

function RaceTooltip({ active, payload, label }: Record<string, unknown>) {
  if (!active || !Array.isArray(payload) || payload.length === 0) return null

  const data = (payload[0] as { payload: ChartDataPoint }).payload
  const raceList = data.races

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs shadow-xl">
      <p className="text-zinc-500">{label as string}</p>
      <p className="mt-0.5 font-mono tabular-nums text-zinc-100">
        {Number((payload[0] as { value: number }).value).toFixed(1)} mi
      </p>
      {raceList && raceList.length > 0 && (
        <div className="mt-1.5 border-t border-zinc-800 pt-1.5 space-y-1">
          {groupByMeet(raceList).map((group, i) => (
            <div key={i}>
              {group.meet && (
                <p className="text-zinc-500">{group.meet}</p>
              )}
              {group.races.map((race, j) => (
                <div key={j} className="flex items-baseline gap-1.5">
                  <span className="text-emerald-400">{race.event}</span>
                  <span className="font-mono tabular-nums text-zinc-100">{race.time}</span>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

interface MeetGroup {
  meet?: string
  races: Race[]
}

function groupByMeet(raceList: Race[]): MeetGroup[] {
  const map = new Map<string, Race[]>()
  for (const race of raceList) {
    const key = race.meet ?? ""
    const arr = map.get(key) ?? []
    arr.push(race)
    map.set(key, arr)
  }
  return Array.from(map.entries()).map(([meet, rs]) => ({
    meet: meet || undefined,
    races: rs,
  }))
}

interface MileageChartProps {
  data: ChartDataPoint[]
  highlights?: HighlightRange[]
  isLoading?: boolean
  className?: string
  animate?: boolean
  lineType?: "monotone" | "linear" | "natural"
}

export function MileageChart({ data, highlights, isLoading, className, animate = true, lineType = "monotone" }: MileageChartProps) {
  const height = className ?? "h-[280px]"

  if (isLoading) {
    return <ChartSkeleton />
  }

  if (data.length === 0) {
    return (
      <div className={`flex ${height} w-full items-center justify-center`}>
        <p className="text-sm text-zinc-500">No runs in this range</p>
      </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} className={`${height} w-full`}>
      <LineChart
        accessibilityLayer
        data={data}
        margin={{ left: 12, right: 12, top: 8, bottom: 0 }}
      >
        <CartesianGrid
          vertical={false}
          strokeDasharray="3 3"
          stroke="var(--color-border)"
        />
        {highlights?.map((h, i) => (
          <ReferenceArea
            key={i}
            x1={h.x1}
            x2={h.x2}
            fill={h.color}
            fillOpacity={0.1}
            stroke="none"
            style={{ pointerEvents: "none", outline: "none" }}
          />
        ))}
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={12}
          stroke="var(--color-muted-foreground)"
          interval="preserveStartEnd"
          tickFormatter={(label: string) => label.replace(/ \d+,.*/, "")}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={12}
          stroke="var(--color-muted-foreground)"
          tickFormatter={(value) => `${value}mi`}
          width={48}
        />
        <Tooltip
          content={<RaceTooltip />}
          cursor={{ stroke: "var(--color-emerald)", strokeOpacity: 0.2 }}
        />
        <Line
          dataKey="miles"
          type={lineType}
          stroke="var(--color-miles)"
          strokeWidth={2}
          dot={<RaceDot />}
          activeDot={{ r: 4, strokeWidth: 0, fill: "var(--color-miles)" }}
          isAnimationActive={animate}
          animationDuration={animate ? 750 : 0}
        />
      </LineChart>
    </ChartContainer>
  )
}
