import { format } from "date-fns"
import type { DateRange } from "react-day-picker"
import type { NamedPreset } from "@/lib/types"

export interface BuiltInPreset {
  name: string
  from: string
  to: string
}

export const BUILT_IN_PRESETS: BuiltInPreset[] = [
  { name: "11th Grade", from: "2026-05-17", to: "" },
  { name: "10th Grade", from: "2025-05-24", to: "2026-05-23" },
  { name: "9th Grade", from: "2024-05-25", to: "2025-05-24" },
  { name: "8th Grade", from: "2023-05-20", to: "2024-05-25" },
]

export const SERIES_COLORS = [
  "var(--color-emerald)",
  "#60a5fa",
  "#fbbf24",
  "#c084fc",
  "#fb7185",
  "#22d3ee",
  "#a3e635",
]

const fmt = (d: Date) => format(d, "yyyy-MM-dd")

export function rangeToString(range: DateRange | undefined): string | null {
  if (!range?.from || !range?.to) return null
  return `${fmt(range.from)}..${fmt(range.to)}`
}

function matches(
  a: { from: string; to: string },
  b: { from: string; to: string }
): boolean {
  return a.from === b.from && a.to === b.to
}

export function toPresetList(
  saved: NamedPreset[],
  builtIn: BuiltInPreset[] = BUILT_IN_PRESETS
): { name: string; from: string; to: string }[] {
  return [
    ...builtIn.map((p) => ({
      name: p.name,
      from: p.from,
      to: p.to || fmt(new Date()),
    })),
    ...saved.map((p) => ({ name: p.name, from: p.from, to: p.to })),
  ]
}

export function rangeName(
  range: DateRange | undefined,
  saved: NamedPreset[]
): string | null {
  const key = rangeToString(range)
  if (!key) return null

  const [from, to] = key.split("..")
  for (const preset of toPresetList(saved)) {
    if (matches(preset as { from: string; to: string }, { from, to })) {
      return preset.name
    }
  }
  return null
}