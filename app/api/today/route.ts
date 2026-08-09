import { NextRequest, NextResponse } from "next/server"
import { redis } from "@/lib/redis"
import { fetchActivityById, fetchActivityHrStream } from "@/lib/strava"
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
        const [full, hrStream] = await Promise.all([
          fetchActivityById(a.id),
          fetchActivityHrStream(a.id).catch(() => null),
        ])

        return {
          ...a,
          average_heartrate: full.average_heartrate ?? null,
          hr_stream: hrStream,
          weather_temp_c: full.average_weather_temp ?? full.average_temp ?? null,
          weather_feels_like_c: full.average_feels_like ?? null,
          weather_wind_speed: full.average_wind_speed ?? null,
          weather_clouds: full.average_clouds ?? null,
          weather_summary: full.weather_summary ?? null,
        }
      } catch {
        return a
      }
    })
  )

  return NextResponse.json(detailed)
}
