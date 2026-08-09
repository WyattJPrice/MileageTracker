"use client"

import { TodayRunChart } from "@/components/today-run-chart"
import type { DetailedActivity } from "@/lib/types"

function formatPace(movingTimeSec: number, distanceMiles: number): string {
  if (distanceMiles < 0.01) return "—"
  const paceSecPerMile = movingTimeSec / distanceMiles
  const min = Math.floor(paceSecPerMile / 60)
  const sec = Math.round(paceSecPerMile % 60)
  return `${min}:${sec.toString().padStart(2, "0")}/mi`
}

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  return `${m}:${s.toString().padStart(2, "0")}`
}

interface TodayCardProps {
  runs: DetailedActivity[]
  isLoading: boolean
}

export function TodayCard({ runs, isLoading }: TodayCardProps) {
  const hasRuns = runs.length > 0
  const totalMiles = runs.reduce((s, r) => s + r.distance_miles, 0)
  const totalSeconds = runs.reduce((s, r) => s + r.moving_time_seconds, 0)

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 h-full flex flex-col overflow-hidden">
      <p className="mb-3 shrink-0 text-xs font-medium uppercase tracking-wider text-zinc-500">Today</p>

      {isLoading ? (
        <div className="space-y-3">
          <div className="h-12 w-40 rounded bg-zinc-800 animate-pulse" />
          <div className="h-4 w-24 rounded bg-zinc-800 animate-pulse" />
        </div>
      ) : !hasRuns ? (
        <div className="flex flex-col gap-1">
          <p className="text-3xl font-semibold tabular-nums text-zinc-600">—</p>
          <p className="text-sm text-zinc-600">No run recorded yet</p>
        </div>
      ) : (
        <div className="flex flex-col gap-3 min-h-0">
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-3xl font-semibold tabular-nums text-zinc-100">
              {totalMiles.toFixed(2)}
            </span>
            <span className="text-base text-zinc-400">mi</span>
          </div>

          <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
            <div>
              <span className="text-zinc-500">Pace </span>
              <span className="font-mono tabular-nums text-zinc-200">
                {formatPace(totalSeconds, totalMiles)}
              </span>
            </div>
            <div>
              <span className="text-zinc-500">Time </span>
              <span className="font-mono tabular-nums text-zinc-200">
                {formatDuration(totalSeconds)}
              </span>
            </div>
            {runs.length === 1 && runs[0].average_heartrate && (
              <div>
                <span className="text-zinc-500">Avg HR </span>
                <span className="font-mono tabular-nums text-zinc-200">
                  {Math.round(runs[0].average_heartrate)} bpm
                </span>
              </div>
            )}
          </div>

          {runs.map((r) => (
            <div key={r.id} className="border-t border-zinc-800 pt-2">
              <div className="mb-2 flex items-baseline justify-between">
                <span className="font-mono tabular-nums text-zinc-200">
                  {r.distance_miles.toFixed(2)} mi
                </span>
                {runs.length === 1 ? (
                  <div className="flex gap-3 font-mono text-xs tabular-nums text-zinc-500">
                    <span>{formatPace(r.moving_time_seconds, r.distance_miles)}</span>
                    <span>{formatDuration(r.moving_time_seconds)}</span>
                    {r.average_heartrate && <span>{Math.round(r.average_heartrate)} bpm</span>}
                  </div>
                ) : (
                  <div className="flex gap-3 font-mono text-xs tabular-nums text-zinc-500">
                    <span>{formatPace(r.moving_time_seconds, r.distance_miles)}</span>
                    {r.average_heartrate && (
                      <span>
                        Avg <span className="text-zinc-300">{Math.round(r.average_heartrate)} bpm</span>
                      </span>
                    )}
                    {r.maximum_heartrate && (
                      <span>
                        Max <span className="text-rose-400">{Math.round(r.maximum_heartrate)} bpm</span>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {runs.length === 1 && r.stream && (
                <TodayRunChart stream={r.stream} maxHeartrate={r.maximum_heartrate} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}