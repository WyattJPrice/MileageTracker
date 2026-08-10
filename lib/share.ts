import { format } from "date-fns"
import type { DateRange } from "react-day-picker"

const fmt = (d: Date) => format(d, "yyyy-MM-dd")
const EMPTY = "_"

function parseDate(s: string): Date {
  return new Date(s + "T12:00:00")
}

function encodeRange(range: DateRange | undefined): string {
  if (!range?.from || !range?.to) return EMPTY
  return `${fmt(range.from)}:${fmt(range.to)}`
}

function decodeRange(token: string): DateRange | undefined {
  if (!token || token === EMPTY) return undefined
  const [from, to] = token.split(":")
  if (!from || !to) return undefined
  return { from: parseDate(from), to: parseDate(to) }
}

// A single panel's ranges (joined with ","), panels joined with ";"
export function encodeView(
  panels: (DateRange | undefined)[][]
): string {
  return panels
    .map((ranges) => ranges.map(encodeRange).join(","))
    .join(";")
}

export function decodeView(view: string | null): (DateRange | undefined)[][] | null {
  if (!view) return null
  const panels = view.split(";").map((panelStr) =>
    panelStr
      .split(",")
      .filter(Boolean)
      .map(decodeRange)
  )
  if (panels.length === 0) return null
  return panels
}