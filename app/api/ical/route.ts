import { NextRequest, NextResponse } from "next/server"
import { sync as icalSync } from "node-ical"
import type { VEvent } from "node-ical"
import type { ICalEvent } from "@/lib/types"

const ICAL_URL = "https://log.finalsurge.com/delivery/ical/7RGXFCXBBS1Y1LS"

function paramVal(v: unknown): string {
  if (typeof v === "string") return v
  if (v && typeof v === "object" && "val" in v) return String((v as { val: unknown }).val)
  return ""
}

// VALUE=DATE all-day events parse to exactly midnight UTC; timed events have a real time component.
function isAllDay(date: Date): boolean {
  return (
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0
  )
}

export async function GET(request: NextRequest) {
  // Client passes its getTimezoneOffset() value (minutes west of UTC, e.g. CDT = 300).
  const tzOffset = parseInt(request.nextUrl.searchParams.get("tz") ?? "0")

  try {
    const res = await fetch(ICAL_URL, { cache: "no-store" })
    if (!res.ok) return NextResponse.json([])
    const body = await res.text()
    const data = icalSync.parseICS(body)

    // Today in the client's local timezone
    const localNow = new Date(Date.now() - tzOffset * 60000)
    const todayStr = localNow.toISOString().split("T")[0]

    const events: ICalEvent[] = Object.values(data)
      .filter((e): e is VEvent => e?.type === "VEVENT")
      .map((e) => {
        const start = e.start instanceof Date ? e.start : new Date(e.start as string)
        // All-day (VALUE=DATE): Final Surge stores the intended local date, already correct.
        // Timed (with Z suffix): stored in UTC, convert to client's local date.
        const dateStr = isAllDay(start)
          ? start.toISOString().split("T")[0]
          : new Date(start.getTime() - tzOffset * 60000).toISOString().split("T")[0]
        const desc = e.description ? paramVal(e.description) : undefined
        return { date: dateStr, summary: paramVal(e.summary), description: desc, _sort: dateStr }
      })
      .filter((e) => e.date >= todayStr)
      .sort((a, b) => a._sort.localeCompare(b._sort))
      .slice(0, 7)
      .map(({ _sort: _, ...e }) => e)

    return NextResponse.json(events)
  } catch {
    return NextResponse.json([])
  }
}
