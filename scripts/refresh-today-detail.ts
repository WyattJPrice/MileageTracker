import { Redis } from "@upstash/redis"
import { getActivity, getStreams } from "@/lib/intervals"
import { downsampleStream } from "@/lib/utils"
import type { ActivityInterval, ActivityStream } from "@/lib/types"

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

function localToday(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

async function main() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    console.error("Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN in .env.local")
    process.exit(1)
  }

  const redis = new Redis({ url, token })

  const date = localToday()
  const startTs = Math.floor(new Date(date).getTime() / 1000) - 14 * 3600
  const endTs = Math.floor(new Date(date + "T23:59:59").getTime() / 1000) + 14 * 3600
  const raw = await redis.zrange("activities:runs", startTs, endTs, { byScore: true })

  const today = raw
    .map((r) => (typeof r === "string" ? JSON.parse(r) : r))
    .filter((a) => a.date === date)

  if (today.length === 0) {
    console.error(`No runs found in Redis for ${date}`)
    process.exit(1)
  }

  for (const a of today) {
    const key = `activities:detail:${a.id}`
    console.log(`Refreshing ${key} (${a.name} / ${a.distance_miles} mi)`)

    const [full, rawStream] = await Promise.all([getActivity(a.id), getStreams(a.id)])
    const detail: CachedDetail = {
      description: full.description ?? null,
      average_heartrate: full.average_heartrate ?? null,
      maximum_heartrate: full.max_heartrate ?? null,
      elapsed_time: full.elapsed_time ?? null,
      total_elevation_gain: full.total_elevation_gain ?? null,
      calories: full.calories ?? null,
      average_cadence: full.average_cadence ?? null,
      average_stride: full.average_stride ?? null,
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

    await redis.set(key, detail, { ex: DETAIL_TTL })
    console.log(
      `  avg HR ${detail.average_heartrate} | max HR ${detail.maximum_heartrate} | elev ${detail.total_elevation_gain}m | cal ${detail.calories} | cadence ${detail.average_cadence} | stride ${detail.average_stride}m | stream points ${detail.stream?.time.length}`
    )
  }

  console.log(`Done. Refreshed ${today.length} run(s) for ${date}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
