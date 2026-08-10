"use client"

import * as React from "react"
import { format } from "date-fns"
import { ChevronDown, Save, Trash2 } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { usePresets } from "@/lib/use-presets"
import { rangeName, toPresetList, type BuiltInPreset } from "@/lib/presets"

function parseDate(s: string): Date {
  return new Date(s + "T12:00:00")
}

function toInput(d: Date | undefined): string {
  return d ? format(d, "yyyy-MM-dd") : ""
}

interface DateRangePickerProps {
  dateRange: DateRange | undefined
  onDateRangeChange: (range: DateRange | undefined) => void
  compact?: boolean
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  compact = false,
}: DateRangePickerProps) {
  const { presets, savePreset, deletePreset } = usePresets()
  const [menuOpen, setMenuOpen] = React.useState(false)
  const [presetName, setPresetName] = React.useState("")
  const [saving, setSaving] = React.useState(false)
  const [justSaved, setJustSaved] = React.useState(false)

  const activeName = rangeName(dateRange, presets)
  const isCustom = !!(dateRange?.from && dateRange?.to) && !activeName

  const triggerLabel = activeName
    ? activeName
    : isCustom
      ? `${format(dateRange!.from!, "MMM d, yy")} – ${format(dateRange!.to!, "MMM d, yy")}`
      : "Select range"

  const setFrom = (value: string) => {
    if (!value) {
      onDateRangeChange(dateRange?.to ? { from: undefined, to: dateRange.to } : undefined)
      return
    }
    onDateRangeChange({
      from: parseDate(value),
      to: dateRange?.to ?? undefined,
    })
  }

  const setTo = (value: string) => {
    if (!value) {
      onDateRangeChange(dateRange?.from ? { from: dateRange.from, to: undefined } : undefined)
      return
    }
    onDateRangeChange({
      from: dateRange?.from ?? undefined,
      to: parseDate(value),
    })
  }

  const handleSave = async () => {
    if (!dateRange?.from || !dateRange?.to || !presetName.trim()) return
    setSaving(true)
    const ok = await savePreset(
      presetName.trim(),
      format(dateRange.from, "yyyy-MM-dd"),
      format(dateRange.to, "yyyy-MM-dd")
    )
    setSaving(false)
    if (ok) {
      setPresetName("")
      setJustSaved(true)
      setTimeout(() => setJustSaved(false), 1500)
    }
  }

  const selectPreset = (from: string, to: string) => {
    onDateRangeChange({ from: parseDate(from), to: parseDate(to) })
    setMenuOpen(false)
  }

  const builtIns = toPresetList([]).map((p, i) => ({
    ...p,
    id: `builtin-${i}`,
    isBuiltIn: true,
  })) as (BuiltInPreset & { id: string; isBuiltIn: boolean })[]

  const savedItems = presets.map((p) => ({
    name: p.name,
    from: p.from,
    to: p.to,
    id: p.id,
    isBuiltIn: false,
  }))

  const presetItems = [...savedItems, ...builtIns]

  return (
    <Popover open={menuOpen} onOpenChange={setMenuOpen}>
      <PopoverTrigger
        className={cn(
          "flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-200",
          compact && "px-1.5"
        )}
      >
        <span className={cn(isCustom && "font-mono tabular-nums")}>
          {triggerLabel}
        </span>
        <ChevronDown className="h-3 w-3" />
      </PopoverTrigger>
      <PopoverContent
        className="w-64 border-zinc-800 bg-zinc-900 p-2"
        align="end"
      >
        <div className="flex flex-col gap-1">
          {presetItems.map((preset) => (
            <div key={preset.id} className="group flex items-center">
              <button
                onClick={() => selectPreset(preset.from, preset.to)}
                className={cn(
                  "flex-1 rounded-md px-2.5 py-1.5 text-left text-xs transition-colors",
                  activeName === preset.name
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                )}
              >
                {preset.name}
              </button>
              {!preset.isBuiltIn && (
                <button
                  onClick={() => deletePreset(preset.id)}
                  aria-label={`Delete preset ${preset.name}`}
                  className="rounded-md p-1.5 text-zinc-600 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-zinc-800 hover:text-rose-400"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              )}
            </div>
          ))}

          <div className="my-1 border-t border-zinc-800" />

          <div className="flex flex-col gap-1.5 px-1 py-1">
            <div className="flex items-center gap-2">
              <label className="w-8 text-[11px] uppercase tracking-wide text-zinc-500">
                From
              </label>
              <input
                type="date"
                value={toInput(dateRange?.from)}
                onChange={(e) => setFrom(e.target.value)}
                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1 text-xs text-zinc-200 [color-scheme:dark] focus:border-zinc-600 focus:outline-none"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="w-8 text-[11px] uppercase tracking-wide text-zinc-500">
                To
              </label>
              <input
                type="date"
                value={toInput(dateRange?.to)}
                onChange={(e) => setTo(e.target.value)}
                className="w-full rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1 text-xs text-zinc-200 [color-scheme:dark] focus:border-zinc-600 focus:outline-none"
              />
            </div>
          </div>

          {dateRange?.from && dateRange?.to && (
            <div className="mt-1 flex items-center gap-1.5 border-t border-zinc-800 pt-2">
              <input
                type="text"
                value={presetName}
                onChange={(e) => setPresetName(e.target.value)}
                placeholder="Preset name"
                className="min-w-0 flex-1 rounded-md border border-zinc-800 bg-zinc-950 px-2 py-1 text-xs text-zinc-200 placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
              />
              <button
                onClick={handleSave}
                disabled={!presetName.trim() || saving}
                className={cn(
                  "flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                  justSaved
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                )}
              >
                {justSaved ? (
                  "Saved"
                ) : (
                  <>
                    <Save className="h-3 w-3" />
                    Save
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  )
}