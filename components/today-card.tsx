"use client"

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

function formatDegrees(value?: number | null): string | null {
  if (value == null || !Number.isFinite(value)) return null
  return `${Math.round(value)}°C`
}

function hasWeather(run: DetailedActivity): boolean {
  return Boolean(
    run.weather_temp_c != null ||
    run.weather_feels_like_c != null ||
    run.weather_wind_speed != null ||
    run.weather_clouds != null ||
    run.weather_summary
  )
}

function HeartRateTrend({ data }: { data: number[] }) {
  if (data.length < 2) return null

  const width = 220
  const height = 52
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = Math.max(1, max - min)

  const points = data
    .map((value, i) => {
      const x = (i / (data.length - 1)) * width
      const y = height - ((value - min) / range) * height
      return `${x},${y}`
    })
    .join(" ")

  return (
    <div className="mt-1 rounded-md border border-zinc-800 bg-zinc-950/60 px-2 py-1.5">
      <div className="mb-1 flex items-center justify-between text-[10px] text-zinc-500">
        <span>HR Trend</span>
        <span className="font-mono tabular-nums">{min}–{max} bpm</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="h-12 w-full">
        <polyline
          fill="none"
          stroke="oklch(0.7 0.18 155)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
      </svg>
    </div>
  )
}

interface TodayCardProps {
  runs: DetailedActivity[]
  isLoading: boolean
}

export function TodayCard({ runs, isLoading }: TodayCardProps) {
  const hasRuns = runs.length > 0
  const totalMiles = runs.reduce((s, r) => s + r.distance_miles, 0)
  const totalSeconds = runs.reduce((s, r) => s + r.moving_time_seconds, 0)

  const weightedHr = (() => {
    const withHr = runs.filter((r) => typeof r.average_heartrate === "number")
    if (withHr.length === 0) return null
    const weighted = withHr.reduce(
      (sum, run) => sum + (run.average_heartrate ?? 0) * run.moving_time_seconds,
      0
    )
    const duration = withHr.reduce((sum, run) => sum + run.moving_time_seconds, 0)
    if (duration <= 0) return null
    return Math.round(weighted / duration)
  })()
  const streamRun = runs.find((r) => (r.hr_stream?.length ?? 0) > 1)
  const weatherRun = runs.find(hasWeather)

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
        <div className="flex flex-col gap-3 min-h-0 overflow-y-auto">
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
            {weightedHr && (
              <div>
                <span className="text-zinc-500">Avg HR </span>
                <span className="font-mono tabular-nums text-zinc-200">
                  {weightedHr} bpm
                </span>
              </div>
            )}
          </div>

          {streamRun?.hr_stream && <HeartRateTrend data={streamRun.hr_stream} />}

          {weatherRun && (
          <div className="rounded-md border border-zinc-800 bg-zinc-950/60 px-3 py-2 text-xs">
            <p className="mb-1 text-[10px] uppercase tracking-wider text-zinc-500">Weather</p>
            <div className="flex flex-wrap gap-x-3 gap-y-1 text-zinc-300">
              {formatDegrees(weatherRun.weather_temp_c) && (
                <span>Temp {formatDegrees(weatherRun.weather_temp_c)}</span>
              )}
              {formatDegrees(weatherRun.weather_feels_like_c) && (
                <span>Feels {formatDegrees(weatherRun.weather_feels_like_c)}</span>
              )}
              {weatherRun.weather_wind_speed != null && (
                <span>Wind {weatherRun.weather_wind_speed.toFixed(1)}</span>
              )}
              {weatherRun.weather_clouds != null && (
                <span>Clouds {Math.round(weatherRun.weather_clouds)}%</span>
              )}
              {weatherRun.weather_summary && (
                <span className="text-zinc-400">{weatherRun.weather_summary}</span>
              )}
            </div>
          </div>
          )}

          {runs.length > 1 && (
            <div className="space-y-1.5">
              {runs.map((r) => (
                <div key={r.id} className="flex items-baseline gap-3 text-sm">
                  <span className="font-mono tabular-nums text-zinc-200">{r.distance_miles.toFixed(2)} mi</span>
                  <span className="text-zinc-500">{formatPace(r.moving_time_seconds, r.distance_miles)}</span>
                  {r.average_heartrate && (
                    <span className="text-zinc-500">{Math.round(r.average_heartrate)} bpm</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
