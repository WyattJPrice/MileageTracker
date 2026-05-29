import { NextResponse } from "next/server"
import { sync as icalSync } from "node-ical"
import type { VEvent } from "node-ical"
import type { ICalEvent } from "@/lib/types"

const ICAL_URL = "https://log.finalsurge.com/delivery/ical/7RGXFCXBBS1Y1LS"

function paramVal(v: unknown): string {
  if (typeof v === "string") return v
  if (v && typeof v === "object" && "val" in v) return String((v as { val: unknown }).val)
  return ""
}

export async function GET() {
  try {
    const res = await fetch(ICAL_URL, { next: { revalidate: 300 } })
    if (!res.ok) return NextResponse.json([])
    const body = await res.text()
    const data = icalSync.parseICS(body)

    const todayStr = new Date().toISOString().split("T")[0]

    const events: ICalEvent[] = Object.values(data)
      .filter((e): e is VEvent => e?.type === "VEVENT")
      .map((e) => {
        const start = e.start instanceof Date ? e.start : new Date(e.start as string)
        const dateStr = start.toISOString().split("T")[0]
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
