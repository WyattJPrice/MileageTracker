import { NextRequest, NextResponse } from "next/server"
import { redis } from "@/lib/redis"
import { fetchActivityById } from "@/lib/strava"
import type { Activity, DetailedActivity } from "@/lib/types"

const BUFFER_S = 14 * 3600

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date")
  if (!date) {
    return NextResponse.json({ error: "date query param required" }, { status: 400 })
  }

  const startTs = Math.floor(new Date(date).getTime() / 1000) - BUFFER_S
  const endTs = Math.floor(new Date(date + "T23:59:59").getTime() / 1000) + BUFFER_S

  const raw = await redis.zrange("activities:runs", startTs, endTs, { byScore: true })

  const activities: Activity[] = raw
    .map((r) => (typeof r === "string" ? JSON.parse(r) : r) as Activity)
    .filter((a) => a.date === date)

  const detailed: DetailedActivity[] = await Promise.all(
    activities.map(async (a): Promise<DetailedActivity> => {
      try {
        const full = await fetchActivityById(a.id)
        return {
          ...a,
          description: full.description ?? null,
          average_heartrate: full.average_heartrate ?? null,
        }
      } catch {
        return a
      }
    })
  )

  return NextResponse.json(detailed)
}
