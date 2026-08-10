"use client"

import { format } from "date-fns"
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  XAxis,
  YAxis,
} from "recharts"
import {
  ChartContainer,
  type ChartConfig,
  ChartTooltip,
} from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import type { Race } from "@/lib/types"

export interface ComparisonHighlight {
  x1: number
  x2: number
  color: string
}

export interface ComparisonWeekPoint {
  date: string
  week: number
  miles: number | null
  races: Race[]
}

export interface ComparisonSeries {
  key: string
  label: string
  color: string
  data: ComparisonWeekPoint[]
}

interface ComparisonChartProps {
  series: ComparisonSeries[]
  highlights?: ComparisonHighlight[]
  isLoading?: boolean
  className?: string
}

function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={`flex ${className} w-full flex-col gap-3 p-4`}>
      <div className="flex h-full items-end gap-2">
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

function RaceDot({
  cx,
  cy,
  payload,
  seriesKey,
  color,
}: {
  cx?: number
  cy?: number
  payload?: Record<string, unknown>
  seriesKey: string
  color: string
}) {
  const races = (payload?.[`${seriesKey}-races`] as Race[] | undefined) ?? []
  if (cx === undefined || cy === undefined || races.length === 0) return null
  return (
    <circle
      cx={cx}
      cy={cy}
      r={4}
      fill={color}
      stroke="oklch(0.098 0.005 285.82)"
      strokeWidth={2}
    />
  )
}

function ComparisonTooltip({
  active,
  payload,
  series,
}: {
  active?: boolean
  payload?: Array<Record<string, unknown>>
  series: ComparisonSeries[]
}) {
  if (!active || !Array.isArray(payload) || payload.length === 0) return null

  const row = payload[0]?.payload as
    | (Record<string, unknown> & { date?: string; week?: number })
    | undefined

  const visible = series.filter((s) => {
    const v = row?.[s.key]
    const races = (row?.[`${s.key}-races`] as Race[] | undefined) ?? []
    return (
      (v !== null && v !== undefined) || races.length > 0
    )
  })

  if (visible.length === 0) return null

  return (
    <div className="rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-2 text-xs shadow-xl">
      <p className="text-zinc-500">
        {row?.date
          ? format(new Date(row.date + "T12:00:00"), "EEE, MMM d, ''yy")
          : row?.week
            ? `Wk ${row.week}`
            : ""}
      </p>
      <div className="mt-1.5 space-y-1.5">
        {visible.map((s, i) => {
          const value = row?.[s.key] as number | null | undefined
          const date = row?.[`${s.key}-date`] as string | undefined
          const races = (row?.[`${s.key}-races`] as Race[] | undefined) ?? []
          return (
            <div
              key={s.key}
              className={i > 0 ? "border-t border-zinc-800 pt-1.5" : undefined}
            >
              <div className="flex items-center gap-1.5">
                <span
                  className="h-2 w-2 shrink-0 rounded-sm"
                  style={{ backgroundColor: s.color }}
                />
                <span className="text-zinc-400">{s.label}</span>
                <span className="font-mono tabular-nums text-zinc-100">
                  {value === null || value === undefined
                    ? "–"
                    : `${Number(value).toFixed(1)} mi`}
                </span>
                {date && (
                  <span className="ml-auto pl-2 text-zinc-600">
                    {format(new Date(date + "T12:00:00"), "MMM d ''yy")}
                  </span>
                )}
              </div>
              {races.length > 0 && (
                <div className="mt-1 space-y-1 pl-3.5">
                  {groupByMeet(races).map((group, j) => (
                    <div key={j}>
                      {group.meet && (
                        <p className="text-zinc-500">{group.meet}</p>
                      )}
                      {group.races.map((race, k) => (
                        <div key={k} className="flex items-baseline gap-1.5">
                          <span style={{ color: s.color }}>{race.event}</span>
                          <span className="font-mono tabular-nums text-zinc-100">
                            {race.time}
                          </span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function ComparisonChart({
  series,
  highlights,
  isLoading,
  className = "h-[280px]",
}: ComparisonChartProps) {
  const chartConfig = Object.fromEntries(
    series.map((s) => [s.key, { label: s.label, color: s.color }])
  ) satisfies ChartConfig

  if (isLoading) {
    return <ChartSkeleton className={className} />
  }

  const weeks = Array.from(
    new Set(series.flatMap((s) => s.data.map((d) => d.week)))
  ).sort((a, b) => a - b)

  if (weeks.length === 0) {
    return (
      <div className={`flex ${className} w-full items-center justify-center`}>
        <p className="text-sm text-zinc-500">No runs in this range</p>
      </div>
    )
  }

  const combined = weeks
    .map((week) => {
      const row: Record<string, unknown> = { week }
      for (const s of series) {
        const point = s.data.find((d) => d.week === week)
        row[s.key] = point?.miles ?? null
        row[`${s.key}-races`] = point?.races ?? []
        row[`${s.key}-date`] = point?.date
      }
      return row
    })
    .filter((row) =>
      series.some((s) => {
        const v = row[s.key]
        return v !== null && v !== undefined
      })
    )

  const hasVisible = combined.some((row) =>
    series.some((s) => {
      const v = row[s.key]
      return v !== null && v !== undefined
    })
  )

  if (!hasVisible) {
    return (
      <div className={`flex ${className} w-full items-center justify-center`}>
        <p className="text-sm text-zinc-500">No runs in this range</p>
      </div>
    )
  }

  return (
    <ChartContainer config={chartConfig} className={`${className} w-full`}>
      <LineChart
        accessibilityLayer
        data={combined}
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
          dataKey="week"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={12}
          stroke="var(--color-muted-foreground)"
          tickFormatter={(v: number) => `Wk ${v}`}
          interval="preserveStartEnd"
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
        <ChartTooltip
          content={<ComparisonTooltip series={series} />}
          cursor={{ stroke: "var(--color-border)", strokeOpacity: 0.4 }}
        />
        {series.map((s) => (
          <Line
            key={s.key}
            dataKey={s.key}
            type="monotone"
            stroke={s.color}
            strokeWidth={2}
            dot={
              <RaceDot
                seriesKey={s.key}
                color={s.color}
              />
            }
            activeDot={{ r: 4, strokeWidth: 0, fill: s.color }}
            isAnimationActive={false}
          />
        ))}
      </LineChart>
    </ChartContainer>
  )
}