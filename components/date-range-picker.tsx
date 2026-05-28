"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon, ChevronDown } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

const presets: { label: string; range: DateRange }[] = [
  {
    label: "11th Grade",
    range: { from: new Date("2026-05-17"), to: new Date() },
  },
  {
    label: "10th Grade",
    range: { from: new Date("2025-05-24"), to: new Date("2026-05-23") },
  },
  {
    label: "9th Grade",
    range: { from: new Date("2024-05-25"), to: new Date("2025-05-24") },
  },
  {
    label: "8th Grade",
    range: { from: new Date("2023-05-20"), to: new Date("2024-05-25") },
  },
]

function rangesEqual(a: DateRange | undefined, b: DateRange): boolean {
  if (!a?.from || !a?.to) return false
  return (
    format(a.from, "yyyy-MM-dd") === format(b.from!, "yyyy-MM-dd") &&
    format(a.to, "yyyy-MM-dd") === format(b.to!, "yyyy-MM-dd")
  )
}

interface DateRangePickerProps {
  dateRange: DateRange | undefined
  onDateRangeChange: (range: DateRange | undefined) => void
  className?: string
}

export function DateRangePicker({
  dateRange,
  onDateRangeChange,
  className,
}: DateRangePickerProps) {
  const [menuOpen, setMenuOpen] = React.useState(false)
  const activePreset = presets.find((p) => rangesEqual(dateRange, p.range))
  const isCustom = dateRange?.from && dateRange?.to && !activePreset

  const triggerLabel = activePreset
    ? activePreset.label
    : isCustom
      ? `${format(dateRange.from!, "MMM d, yy")} – ${format(dateRange.to!, "MMM d, yy")}`
      : "Select range"

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <Popover open={menuOpen} onOpenChange={setMenuOpen}>
        <PopoverTrigger
          className="flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium text-zinc-400 transition-colors hover:text-zinc-200"
        >
          <span className={cn(isCustom && "font-mono tabular-nums")}>
            {triggerLabel}
          </span>
          <ChevronDown className="h-3 w-3" />
        </PopoverTrigger>
        <PopoverContent
          className="w-40 border-zinc-800 bg-zinc-900 p-1"
          align="end"
        >
          <div className="flex flex-col">
            {presets.map((preset) => (
              <button
                key={preset.label}
                onClick={() => {
                  onDateRangeChange(preset.range)
                  setMenuOpen(false)
                }}
                className={cn(
                  "rounded-md px-2.5 py-1.5 text-left text-xs transition-colors",
                  rangesEqual(dateRange, preset.range)
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                )}
              >
                {preset.label}
              </button>
            ))}

            <div className="my-1 border-t border-zinc-800" />

            <Popover>
              <PopoverTrigger
                className={cn(
                  "flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-left text-xs transition-colors",
                  isCustom
                    ? "bg-emerald-500/15 text-emerald-400"
                    : "text-zinc-400 hover:bg-zinc-800 hover:text-zinc-200"
                )}
              >
                <CalendarIcon className="h-3 w-3" />
                Custom
              </PopoverTrigger>
              <PopoverContent
                className="w-auto border-zinc-800 bg-zinc-900 p-0"
                align="end"
                side="left"
              >
                <Calendar
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={onDateRangeChange}
                  numberOfMonths={2}
                  weekStartsOn={0}
                />
              </PopoverContent>
            </Popover>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
