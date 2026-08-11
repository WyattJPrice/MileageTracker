"use client"

import { useMemo } from "react"
import { TodayRunChart } from "@/components/today-run-chart"
import type { ActivityInterval, DetailedActivity } from "@/lib/types"

function formatPaceSec(paceSec: number): string {
  if (paceSec <= 0 || !Number.isFinite(paceSec)) return "—"
  const min = Math.floor(paceSec / 60)
  const sec = Math.round(paceSec % 60)
  return `${min}:${sec.toString().padStart(2, "0")}`
}

function formatDuration(seconds: number): string {
  if (!Number.isFinite(seconds)) return "—"
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  return `${m}:${s.toString().padStart(2, "0")}`
}

function formatPaceSecFromRun(movingTimeSec: number, distanceMiles: number): string {
  if (distanceMiles < 0.01) return "—"
  return formatPaceSec(movingTimeSec / distanceMiles)
}

interface TodayCardProps {
  runs: DetailedActivity[]
  isLoading: boolean
}

function PrimaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-0.5 px-1">
      <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-500">{label}</span>
      <span className="font-mono text-[16px] font-semibold tabular-nums text-zinc-100 leading-tight">
        {value}
      </span>
    </div>
  )
}

function SecondaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-1 flex-col items-center gap-0.5">
      <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-600">{label}</span>
      <span className="font-mono text-sm tabular-nums text-zinc-300">{value}</span>
    </div>
  )
}

function PaceBar({ pace, minPace, maxPace }: { pace: number; minPace: number; maxPace: number }) {
  const span = maxPace - minPace
  const pct = span > 0 ? 25 + 75 * ((maxPace - pace) / span) : 60
  return (
    <div className="flex h-5 items-center">
      <div
        className="h-[5px] rounded-full bg-neon"
        style={{ width: `${Math.max(8, Math.min(100, pct))}%` }}
      />
    </div>
  )
}

function SplitsTable({ intervals }: { intervals: ActivityInterval[] }) {
  const rows = useMemo(() => {
    return intervals.map((it, i) => {
      const distanceMiles = it.distance / 1609.344
      return {
        index: i + 1,
        distanceMiles,
        paceSec: distanceMiles > 0.01 ? it.moving_time / distanceMiles : 0,
        avgHr: it.average_heartrate ?? null,
      }
    })
  }, [intervals])

  if (rows.length === 0) {
    return <p className="text-sm text-zinc-600">No split data</p>
  }

  // Under 20 splits: show HR + neon pace bar, two columns, no scrolling.
  // At 20+ splits: drop HR/bar to fit 3-4 denser columns instead.
  const showDetail = rows.length < 20
  const cols = showDetail ? 2 : rows.length <= 30 ? 3 : 4
  const rowsPerCol = Math.ceil(rows.length / cols)

  if (showDetail) {
    const paces = rows.map((r) => r.paceSec)
    const minPace = Math.min(...paces)
    const maxPace = Math.max(...paces)

    return (
      <div
        className="grid h-full grid-flow-col gap-x-4 gap-y-px"
        style={{
          gridAutoColumns: "minmax(0, 1fr)",
          gridTemplateRows: `repeat(${rowsPerCol}, minmax(0, 1fr))`,
        }}
      >
        {rows.map((r) => (
          <div
            key={r.index}
            className="grid grid-cols-[1.1rem_3.2rem_2.8rem_1fr_2.1rem] items-center gap-1 border-b border-zinc-800/50 px-1"
          >
            <span className="font-mono text-[11px] tabular-nums text-zinc-600">#{r.index}</span>
            <span className="font-mono text-[11px] tabular-nums text-zinc-400">
              {r.distanceMiles.toFixed(2)}
            </span>
            <span className="font-mono text-[11px] font-semibold tabular-nums text-zinc-100">
              {formatPaceSec(r.paceSec)}
            </span>
            <PaceBar pace={r.paceSec} minPace={minPace} maxPace={maxPace} />
            <span className="font-mono text-[11px] tabular-nums text-right text-zinc-300">
              {r.avgHr ?? "—"}
            </span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div
      className="grid h-full grid-flow-col gap-x-3 gap-y-px"
      style={{
        gridAutoColumns: "minmax(0, 1fr)",
        gridTemplateRows: `repeat(${rowsPerCol}, minmax(0, 1fr))`,
      }}
    >
      {rows.map((r) => (
        <div
          key={r.index}
          className="flex items-center justify-between gap-2 border-b border-zinc-800/50 px-1"
        >
          <span className="font-mono text-xs tabular-nums text-zinc-600">#{r.index}</span>
          <span className="font-mono text-xs tabular-nums text-zinc-400">
            {r.distanceMiles.toFixed(2)} mi
          </span>
          <span className="font-mono text-xs font-semibold tabular-nums text-zinc-100">
            {formatPaceSec(r.paceSec)}
          </span>
        </div>
      ))}
    </div>
  )
}

export function TodayCard({ runs, isLoading }: TodayCardProps) {
  const sorted = useMemo(
    () =>
      [...runs].sort((a, b) =>
        (b.start_date_local ?? b.date).localeCompare(a.start_date_local ?? a.date)
      ),
    [runs]
  )

  const hasRuns = sorted.length > 0
  const multiple = sorted.length > 1
  const primary = hasRuns ? sorted[0] : undefined

  const totalMiles = sorted.reduce((s, r) => s + r.distance_miles, 0)
  const totalSeconds = sorted.reduce((s, r) => s + r.moving_time_seconds, 0)

  const elapsed = primary?.elapsed_time ?? totalSeconds
  const moving = primary ? primary.moving_time_seconds : totalSeconds
  const avgPace = primary
    ? formatPaceSecFromRun(primary.moving_time_seconds, primary.distance_miles)
    : formatPaceSecFromRun(moving, totalMiles)
  const avgHr = primary?.average_heartrate
  const maxHr = primary?.maximum_heartrate
  const calories = primary?.calories
  const cadence = primary?.average_cadence != null ? Math.round(primary.average_cadence * 2) : null
  const stride = primary?.average_stride != null ? primary.average_stride.toFixed(2) : null

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 h-full flex flex-col overflow-hidden">
      <p className="shrink-0 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
        Today&apos;s Run{multiple ? "s" : ""}
      </p>

      {isLoading ? (
        <div className="flex flex-1 flex-col justify-center space-y-3">
          <div className="h-12 w-40 rounded bg-zinc-800 animate-pulse" />
          <div className="h-4 w-24 rounded bg-zinc-800 animate-pulse" />
        </div>
      ) : !hasRuns ? (
        <div className="flex flex-1 items-center">
          <p className="text-sm text-zinc-600">No run recorded yet</p>
        </div>
      ) : (
        <div className="flex flex-1 min-h-0 flex-col">
          {/* Multiple runs: each run's distance, same big font, separated by a vertical line */}
          {multiple ? (
            <div className="shrink-0 mt-1 flex items-center gap-3">
              {sorted.map((r, i) => (
                <span key={r.id} className="flex items-center gap-3">
                  {i > 0 && <span className="h-9 w-px bg-zinc-800" />}
                  <span className="font-mono text-[36px] font-semibold tabular-nums text-zinc-100 leading-none">
                    {r.distance_miles.toFixed(2)}
                  </span>
                </span>
              ))}
              <span className="text-[15px] text-zinc-400">mi</span>
            </div>
          ) : (
            /* Single run: big mileage */
            <div className="shrink-0 flex items-baseline gap-2 mt-1">
              <span className="font-mono text-[36px] font-semibold tabular-nums text-zinc-100 leading-none">
                {totalMiles.toFixed(2)}
              </span>
              <span className="text-[15px] text-zinc-400">mi</span>
            </div>
          )}

          {/* Primary metrics row */}
          <div className="shrink-0 mt-4 flex divide-x divide-zinc-800/70">
            <PrimaryMetric label="Time" value={formatDuration(elapsed)} />
            <PrimaryMetric label="Avg Pace" value={avgPace} />
            <PrimaryMetric label="Avg HR" value={avgHr ? `${Math.round(avgHr)} bpm` : "—"} />
            <PrimaryMetric label="Calories" value={calories != null ? String(Math.round(calories)) : "—"} />
          </div>

          {/* Analytics area */}
          <div className="flex-1 min-h-0 grid grid-cols-1 md:grid-cols-[48%_52%] gap-3 mt-4">
            <div className="min-h-0 flex flex-col">
              <p className="shrink-0 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                Heart Rate
              </p>
              <p className="shrink-0 mt-0.5 font-mono text-[15px] font-medium tabular-nums text-zinc-100">
                {avgHr ? `${Math.round(avgHr)} bpm avg` : "—"}
              </p>
              <div className="flex-1 min-h-0 mt-2">
                {primary?.stream ? (
                  <TodayRunChart stream={primary.stream} maxHeartrate={maxHr} />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <p className="text-sm text-zinc-600">No heart rate data</p>
                  </div>
                )}
              </div>
            </div>

              <div className="flex-1 min-h-0 overflow-hidden">
                <p className="shrink-0 text-[11px] font-medium uppercase tracking-wider text-zinc-500">
                  Splits
                  {primary?.intervals && primary.intervals.length > 0 && (
                    <span className="ml-1.5 text-zinc-600">· {primary.intervals.length}</span>
                  )}
                </p>
                <div className="mt-2 h-[calc(100%-1.25rem)] min-h-0">
                  {primary?.intervals && primary.intervals.length > 0 ? (
                    <SplitsTable intervals={primary.intervals} />
                  ) : (
                    <p className="text-sm text-zinc-600">No split data</p>
                  )}
                </div>
              </div>
          </div>

          {/* Bottom secondary metrics */}
          <div className="shrink-0 border-t border-zinc-800 pt-3 mt-3 flex">
            <SecondaryMetric label="Cadence" value={cadence != null ? `${cadence} spm` : "—"} />
            <SecondaryMetric label="Stride" value={stride != null ? `${stride} m` : "—"} />
            <SecondaryMetric label="Moving Time" value={formatDuration(moving)} />
            <SecondaryMetric label="Total Time" value={formatDuration(elapsed)} />
          </div>
        </div>
      )}
    </div>
  )
}
