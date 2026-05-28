import { NextRequest, NextResponse } from "next/server"
import { redis } from "@/lib/redis"
import { fetchRecentActivities, storeActivity } from "@/lib/strava"

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret")
  if (secret !== process.env.STRAVA_ADMIN_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const latest = await redis.zrange<string[]>("activities:runs", -1, -1)
  let after: number | undefined
  if (latest.length > 0) {
    const parsed = typeof latest[0] === "string" ? JSON.parse(latest[0]) : latest[0]
    after = Math.floor(new Date(parsed.date + "T23:59:59").getTime() / 1000)
  }

  const activities = await fetchRecentActivities(after)

  let synced = 0
  let skipped = 0
  for (const activity of activities) {
    const stored = await storeActivity(activity)
    if (stored) synced++
    else skipped++
  }

  return NextResponse.json({ synced, skipped, total: activities.length })
}
