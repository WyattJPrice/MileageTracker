"use client"

import * as React from "react"
import { Check, Link2 } from "lucide-react"
import { format } from "date-fns"
import type { DateRange } from "react-day-picker"
import { ChartPanel } from "@/components/chart-panel"
import { usePresets } from "@/lib/use-presets"
import { toPresetList } from "@/lib/presets"
import { cn } from "@/lib/utils"
import { encodeView, decodeView } from "@/lib/share"

function presetToRange(from: string, to: string): DateRange {
  return { from: new Date(from + "T12:00:00"), to: new Date(to + "T12:00:00") }
}

export function DetailedTab({ initialView }: { initialView?: string | null }) {
  const { presets, isLoading: presetsLoading } = usePresets()
  const [ranges, setRanges] = React.useState<(DateRange | undefined)[]>(() => {
    const decoded = decodeView(initialView ?? null)
    if (decoded && decoded[0] && decoded[0].length > 0) {
      return decoded[0]
    }
    return []
  })
  const [selected, setSelected] = React.useState<string[]>([])
  const [copied, setCopied] = React.useState(false)

  const presetList = React.useMemo(() => toPresetList(presets), [presets])

  const showSelection = ranges.length === 0 && !presetsLoading

  const loadSelected = () => {
    const chosen = selected
      .map((name) => presetList.find((p) => p.name === name))
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
    if (chosen.length === 0) return
    setRanges(chosen.map((p) => presetToRange(p.from, p.to)))
  }

  const handleShare = async () => {
    const view = encodeView([ranges])
    const url = `${window.location.origin}${window.location.pathname}?view=${view}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // clipboard unavailable; leave copied state off
    }
  }

  const toggle = (name: string) => {
    setSelected((prev) =>
      prev.includes(name) ? prev.filter((n) => n !== name) : [...prev, name]
    )
  }

  if (showSelection) {
    return (
      <div className="mx-auto max-w-md">
        <h2 className="mb-2 text-lg font-semibold text-zinc-100">
          Compare presets
        </h2>
        <div className="flex flex-col gap-1.5">
          {presetList.map((p) => {
            const checked = selected.includes(p.name)
            return (
              <label
                key={p.name}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-md border px-3 py-2 text-sm transition-colors",
                  checked
                    ? "border-emerald-500/50 bg-emerald-500/10"
                    : "border-zinc-800 bg-zinc-900 hover:bg-zinc-800"
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(p.name)}
                  className="sr-only"
                />
                <span
                  className={cn(
                    "flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors",
                    checked
                      ? "border-emerald-500 bg-emerald-500/30"
                      : "border-zinc-700"
                  )}
                >
                  {checked && (
                    <svg
                      viewBox="0 0 12 12"
                      className="h-2.5 w-2.5 text-emerald-400"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M2 6l3 3 5-5" />
                    </svg>
                  )}
                </span>
                <span className="text-zinc-200">{p.name}</span>
                <span className="ml-auto font-mono text-xs tabular-nums text-zinc-500">
                  {format(new Date(p.from + "T12:00:00"), "MMM d ''yy")} –{" "}
                  {format(new Date(p.to + "T12:00:00"), "MMM d ''yy")}
                </span>
              </label>
            )
          })}
        </div>
        <button
          onClick={loadSelected}
          disabled={selected.length === 0}
          className="mt-4 w-full rounded-md bg-emerald-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-500 disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-zinc-500"
        >
          {selected.length > 0
            ? `Load ${selected.length} preset${selected.length > 1 ? "s" : ""}`
            : "Select 1 or more presets"}
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-end gap-1 pb-3">
        <button
          onClick={handleShare}
          aria-label="Copy share link for current chart view"
          title="Copy share link"
          className={cn(
            "rounded-md p-1.5 transition-colors",
            copied
              ? "bg-emerald-500/15 text-emerald-400"
              : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
          )}
        >
          {copied ? (
            <Check className="h-4 w-4" />
          ) : (
            <Link2 className="h-4 w-4" />
          )}
        </button>
      </div>

      <ChartPanel ranges={ranges} onRangesChange={setRanges} large />
    </div>
  )
}