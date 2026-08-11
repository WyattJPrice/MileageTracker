import { NextRequest, NextResponse } from "next/server"
import { format, subDays } from "date-fns"
import { redis } from "@/lib/redis"
import { ensureSynced } from "@/lib/intervals"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const start = searchParams.get("start")
  const end = searchParams.get("end")

  if (!start || !end) {
    return NextResponse.json(
      { error: "start and end query params required" },
      { status: 400 }
    )
  }

  // Lazily pull in any new runs from Intervals.icu when the requested range is
  // recent, so both the live dashboard (5-min poll) and the home charts stay
  // current without a cron or webhook. Uses a 3-day lookback so timezone
  // differences between the server (UTC) and the athlete's local date never
  // skip today. ensureSynced throttles and locks so concurrent requests never
  // hammer the API or run duplicate syncs.
  const recentCutoff = format(subDays(new Date(), 3), "yyyy-MM-dd")
  if (end >= recentCutoff) {
    await ensureSynced()
  }

  // Fetch a wider UTC window (±14h) so timezone offsets never exclude activities,
  // then filter precisely by the locally-stored date string.
  const BUFFER_S = 14 * 3600
  const startTs = Math.floor(new Date(start).getTime() / 1000) - BUFFER_S
  const endTs = Math.floor(new Date(end + "T23:59:59").getTime() / 1000) + BUFFER_S

  const raw = await redis.zrange("activities:runs", startTs, endTs, {
    byScore: true,
  })

  const results = raw.filter((r) => {
    const a = typeof r === "string" ? JSON.parse(r) : r
    return a.date >= start && a.date <= end
  })

  return NextResponse.json(results)
}
