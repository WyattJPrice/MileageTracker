import { NextRequest, NextResponse } from "next/server"
import { format, subDays } from "date-fns"
import { listRecentRuns } from "@/lib/intervals"

export const dynamic = "force-dynamic"

// Dev-only: lists recent Run activities from Intervals.icu for the test-run picker.
export async function GET(request: NextRequest) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const limitParam = Number(request.nextUrl.searchParams.get("limit") ?? 60)
  const limit = Number.isFinite(limitParam) ? Math.min(100, Math.max(1, limitParam)) : 60
  const oldest = format(subDays(new Date(), 90), "yyyy-MM-dd")

  try {
    const runs = await listRecentRuns(oldest, limit)
    return NextResponse.json(
      runs.map((r) => ({
        id: r.id,
        date: r.start_date_local?.slice(0, 10) ?? null,
        name: r.name ?? "",
        distance: r.distance ?? 0,
        moving_time: r.moving_time ?? r.elapsed_time ?? 0,
        average_heartrate: r.average_heartrate ?? null,
      }))
    )
  } catch (err) {
    console.error("Dev activities fetch error:", err)
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 })
  }
}
