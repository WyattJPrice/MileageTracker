"use client"

import * as React from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { format } from "date-fns"
import { Check, RotateCcw } from "lucide-react"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import type { DetailedActivity } from "@/lib/types"

interface DevRunItem {
  id: string
  date: string | null
  name: string
  distance: number
  moving_time: number
  average_heartrate: number | null
}

function formatPace(sec: number, distanceM: number): string {
  if (sec <= 0 || distanceM <= 0) return "—"
  const mi = distanceM * 0.000621371
  const paceSec = sec / mi
  const min = Math.floor(paceSec / 60)
  const s = Math.round(paceSec % 60)
  return `${min}:${s.toString().padStart(2, "0")}`
}

function buildUrl(ids: string[]): string {
  const params = new URLSearchParams()
  for (const id of ids) params.append("test", id)
  const qs = params.toString()
  return qs ? `/live?${qs}` : "/live"
}

interface DevToolbarProps {
  testRuns: DetailedActivity[]
  onSelect: (details: DetailedActivity[]) => void
  onLoadingChange?: (loading: boolean) => void
}

export function DevToolbar({ testRuns, onSelect, onLoadingChange }: DevToolbarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [runs, setRuns] = React.useState<DevRunItem[]>([])
  const [isLoading, setIsLoading] = React.useState(false)

  const testIds = searchParams.getAll("test")
  const testKey = testIds.join(",")

  const loadRuns = React.useCallback(async () => {
    setIsLoading(true)
    try {
      const res = await fetch("/api/dev/activities?limit=60")
      if (!res.ok) throw new Error("fetch failed")
      setRuns(await res.json())
    } catch {
      setRuns([])
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    if (process.env.NODE_ENV !== "development") return
    const ids = testKey ? testKey.split(",") : []
    if (ids.length === 0) {
      onSelect([])
      onLoadingChange?.(false)
      return
    }
    let cancelled = false
    onLoadingChange?.(true)
    Promise.all(
      ids.map((id) =>
        fetch(`/api/dev/activity/${id}`)
          .then((r) => r.json())
          .catch(() => null)
      )
    )
      .then((details) => {
        if (cancelled) return
        onSelect(details.filter((d): d is DetailedActivity => d != null))
        onLoadingChange?.(false)
      })
    return () => {
      cancelled = true
    }
  }, [testKey, onSelect, onLoadingChange])

  const toggle = (id: string) => {
    const has = testIds.includes(id)
    const next = has ? testIds.filter((x) => x !== id) : [...testIds, id]
    router.replace(buildUrl(next))
  }

  if (process.env.NODE_ENV !== "development") return null

  return (
    <div className="fixed bottom-4 left-1/2 z-50 -translate-x-1/2">
      <div className="flex items-center gap-1.5 rounded-full border border-zinc-800 bg-zinc-950/80 px-2 py-1.5 shadow-lg shadow-black/40 backdrop-blur">
        {testRuns.length > 0 && (
          <span className="flex items-center gap-1.5 pl-1 pr-2 text-xs text-zinc-300">
            <span className="h-1.5 w-1.5 rounded-full bg-neon" />
            <span className="max-w-[220px] truncate font-medium">
              {testRuns[0].name}
              {testRuns.length > 1 && <span className="text-zinc-500"> +{testRuns.length - 1}</span>}
            </span>
          </span>
        )}
        <Popover onOpenChange={(open) => open && loadRuns()}>
          <PopoverTrigger
            data-slot="dev-toolbar-trigger"
            className="flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-3 py-1 text-xs text-zinc-300 transition-colors hover:border-zinc-500 hover:text-zinc-100 outline-none"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-neon" />
            {testRuns.length > 0 ? "Edit runs" : "Load past run"}
          </PopoverTrigger>
          <PopoverContent className="w-80 border-zinc-800 bg-zinc-900 p-2" align="center" sideOffset={8}>
            <p className="px-1 pb-1.5 text-[10px] font-medium uppercase tracking-wider text-zinc-500">
              Test run picker{testRuns.length > 0 ? ` · ${testRuns.length} selected` : ""}
            </p>
            {isLoading ? (
              <p className="px-1 py-2 text-xs text-zinc-600">Loading…</p>
            ) : runs.length === 0 ? (
              <p className="px-1 py-2 text-xs text-zinc-600">No past runs found</p>
            ) : (
              <div className="max-h-72 overflow-y-auto pr-1">
                {runs.map((r) => {
                  const selected = testIds.includes(r.id)
                  return (
                    <button
                      key={r.id}
                      onClick={() => toggle(r.id)}
                      className="flex w-full items-center justify-between gap-2 rounded-md px-1.5 py-1.5 text-left transition-colors hover:bg-zinc-800"
                    >
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate text-xs font-medium text-zinc-200">{r.name}</span>
                        <span className="text-[10px] text-zinc-500">
                          {r.date ? format(new Date(r.date + "T00:00:00"), "MMM d, yyyy") : "—"}
                        </span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2">
                        <span className="text-right font-mono text-xs tabular-nums text-zinc-400">
                          {r.distance > 0 ? (r.distance * 0.000621371).toFixed(2) : "—"} mi
                          <span className="block text-[10px] text-zinc-600">
                            {formatPace(r.moving_time, r.distance)}
                          </span>
                        </span>
                        <span
                          className={`flex h-4 w-4 items-center justify-center rounded-full border ${
                            selected
                              ? "border-neon bg-neon text-black"
                              : "border-zinc-700 text-transparent"
                          }`}
                        >
                          <Check className="h-3 w-3" strokeWidth={3} />
                        </span>
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </PopoverContent>
        </Popover>
        {testRuns.length > 0 && (
          <button
            onClick={() => {
              router.replace("/live")
              onSelect([])
            }}
            className="flex items-center gap-1 rounded-full border border-zinc-700 px-2 py-1 text-[11px] text-zinc-400 transition-colors hover:border-zinc-500 hover:text-zinc-200"
          >
            <RotateCcw className="h-3 w-3" />
            Clear
          </button>
        )}
      </div>
    </div>
  )
}
