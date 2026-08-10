import { NextRequest, NextResponse } from "next/server"
import { redis } from "@/lib/redis"
import { getActivity, getStreams } from "@/lib/intervals"
import { downsampleStream } from "@/lib/utils"
import type { Activity, ActivityInterval, ActivityStream, DetailedActivity } from "@/lib/types"

const BUFFER_S = 14 * 3600
const DETAIL_TTL = 30 * 60

interface CachedDetail {
  description?: string | null
  average_heartrate?: number | null
  maximum_heartrate?: number | null
  intervals?: ActivityInterval[]
  stream?: ActivityStream
}

async function detailFor(a: Activity): Promise<DetailedActivity> {
  const cacheKey = `activities:detail:${a.id}`
  const cached = await redis.get<CachedDetail>(cacheKey)
  if (cached) return { ...a, ...cached }

  try {
    const [full, rawStream] = await Promise.all([getActivity(a.id), getStreams(a.id)])
    const detail: CachedDetail = {
      description: full.description ?? null,
      average_heartrate: full.average_heartrate ?? null,
      maximum_heartrate: full.max_heartrate ?? null,
      intervals: (full.icu_intervals ?? [])
        .filter((i) => i.type === "WORK" || !i.type)
        .map((i) => ({
          id: i.id,
          distance: i.distance,
          moving_time: i.moving_time,
          average_heartrate: i.average_heartrate ?? null,
          start_index: i.start_index,
          end_index: i.end_index,
        })),
      stream: downsampleStream(rawStream),
    }
    await redis.set(cacheKey, detail, { ex: DETAIL_TTL })
    return { ...a, ...detail }
  } catch {
    return a
  }
}

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

  const detailed = await Promise.all(activities.map(detailFor))

  return NextResponse.json(detailed)
}