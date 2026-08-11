import { NextRequest, NextResponse } from "next/server"
import { format, subDays } from "date-fns"
import { redis } from "@/lib/redis"
import { getDetailedActivity, ensureSynced } from "@/lib/intervals"
import type { Activity, ActivityInterval, ActivityStream, DetailedActivity } from "@/lib/types"

const BUFFER_S = 14 * 3600
const DETAIL_TTL = 30 * 60

interface CachedDetail {
  description?: string | null
  average_heartrate?: number | null
  maximum_heartrate?: number | null
  elapsed_time?: number | null
  total_elevation_gain?: number | null
  calories?: number | null
  average_cadence?: number | null
  average_stride?: number | null
  intervals?: ActivityInterval[]
  stream?: ActivityStream
}

async function detailFor(a: Activity): Promise<DetailedActivity> {
  const cacheKey = `activities:detail:${a.id}`
  const cached = await redis.get<CachedDetail>(cacheKey)
  if (cached) return { ...a, ...cached }

  try {
    const detail = await getDetailedActivity(a.id)
    const cachedDetail: CachedDetail = {
      description: detail.description ?? null,
      average_heartrate: detail.average_heartrate ?? null,
      maximum_heartrate: detail.maximum_heartrate ?? null,
      elapsed_time: detail.elapsed_time ?? null,
      total_elevation_gain: detail.total_elevation_gain ?? null,
      calories: detail.calories ?? null,
      average_cadence: detail.average_cadence ?? null,
      average_stride: detail.average_stride ?? null,
      intervals: detail.intervals,
      stream: detail.stream,
    }
    await redis.set(cacheKey, cachedDetail, { ex: DETAIL_TTL })
    return detail
  } catch {
    return a
  }
}

export async function GET(request: NextRequest) {
  const date = request.nextUrl.searchParams.get("date")
  if (!date) {
    return NextResponse.json({ error: "date query param required" }, { status: 400 })
  }

  // Always sync recent data (3-day lookback for timezone safety) so a run
  // uploaded to Intervals.icu today is reflected here even if the previous
  // page views never touched the /api/activities path.
  const recentCutoff = format(subDays(new Date(), 3), "yyyy-MM-dd")
  if (date >= recentCutoff) {
    await ensureSynced()
  }

  const startTs = Math.floor(new Date(date).getTime() / 1000) - BUFFER_S
  const endTs = Math.floor(new Date(date + "T23:59:59").getTime() / 1000) + BUFFER_S

  const raw = await redis.zrange("activities:runs", startTs, endTs, { byScore: true })

  const activities: Activity[] = raw
    .map((r) => (typeof r === "string" ? JSON.parse(r) : r) as Activity)
    .filter((a) => a.date === date)

  const detailed = await Promise.all(activities.map(detailFor))

  return NextResponse.json(detailed)
}