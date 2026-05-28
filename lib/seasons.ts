import type { SeasonRange } from "@/lib/types"

export const seasons: SeasonRange[] = [
  { type: "track", label: "10th Outdoor", from: "2026-03-06", to: "2026-05-08" },
  { type: "track", label: "10th Indoor", from: "2026-01-24", to: "2026-02-21" },
  { type: "track", label: "9th Outdoor", from: "2025-03-07", to: "2025-05-10" },
  { type: "track", label: "9th Indoor", from: "2025-02-01", to: "2025-02-08" },
  { type: "track", label: "8th", from: "2024-02-24", to: "2024-05-07" },
  { type: "xc", label: "10th", from: "2025-09-13", to: "2025-11-17" },
  { type: "xc", label: "9th", from: "2024-09-07", to: "2024-11-18" },
  { type: "xc", label: "8th", from: "2023-08-28", to: "2023-11-11" },
]

export const TRACK_COLOR = "#f59e0b"
export const XC_COLOR = "#3b82f6"
