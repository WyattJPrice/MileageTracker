import { redis } from "@/lib/redis"
import type { Activity, ActivityInterval, ActivityStream } from "@/lib/types"

const API_BASE = "https://intervals.icu/api/v1"
const ATHLETE_ID = process.env.INTERVALS_ATHLETE_ID ?? "0"
const METERS_TO_MILES = 0.000621371

interface IntervalsActivity {
  id: string
  name?: string
  type?: string
  distance?: number
  moving_time?: number
  elapsed_time?: number
  start_date_local?: string
  average_heartrate?: number | null
  max_heartrate?: number | null
  description?: string | null
}

interface IntervalsActivityDetail extends IntervalsActivity {
  icu_intervals?: (Pick<
    ActivityInterval,
    "id" | "distance" | "moving_time" | "average_heartrate" | "start_index" | "end_index"
  > & { type?: string })[]
}

interface IntervalsStream {
  type: string
  data: number[]
}

function authHeaders(): Record<string, string> {
  const key = process.env.INTERVALS_API_KEY
  if (!key) throw new Error("Missing INTERVALS_API_KEY in .env.local")
  return {
    Authorization: `Basic ${Buffer.from(`API_KEY:${key}`).toString("base64")}`,
  }
}

export async function listActivities(oldest?: string): Promise<IntervalsActivity[]> {
  const all: IntervalsActivity[] = []
  let page = 0

  while (true) {
    const params = new URLSearchParams({
      oldest: oldest ?? "1970-01-01",
      limit: "1000",
      page: String(page),
    })

    const res = await fetch(`${API_BASE}/athlete/${ATHLETE_ID}/activities?${params}`, {
      headers: authHeaders(),
      cache: "no-store",
    })
    if (!res.ok) throw new Error(`List activities failed: ${res.status}`)

    const batch: IntervalsActivity[] = await res.json()
    const runs = batch.filter((a) => a.type === "Run")
    all.push(...runs)

    if (batch.length < 1000) break
    page++
  }

  return all
}

export async function getActivity(id: string): Promise<IntervalsActivityDetail> {
  const res = await fetch(`${API_BASE}/activity/${id}?intervals=true`, {
    headers: authHeaders(),
    cache: "no-store",
  })
  if (!res.ok) throw new Error(`Fetch activity ${id} failed: ${res.status}`)
  return res.json()
}

export async function getStreams(id: string): Promise<ActivityStream> {
  const res = await fetch(
    `${API_BASE}/activity/${id}/streams.json?types=time,heartrate,distance`,
    { headers: authHeaders(), cache: "no-store" }
  )
  if (!res.ok) throw new Error(`Fetch streams ${id} failed: ${res.status}`)

  const raw: IntervalsStream[] = await res.json()
  const pick = (type: string): number[] =>
    raw.find((s) => s.type === type)?.data ?? []

  return {
    heartrate: pick("heartrate"),
    distance: pick("distance"),
    time: pick("time"),
  }
}

export async function storeActivity(raw: IntervalsActivity): Promise<boolean> {
  const exists = await redis.sismember("activities:ids", raw.id)
  if (exists) return false

  const date = raw.start_date_local
    ? raw.start_date_local.slice(0, 10)
    : new Date().toISOString().split("T")[0]

  const stored: Activity = {
    id: raw.id,
    name: raw.name ?? "",
    distance_miles: parseFloat(((raw.distance ?? 0) * METERS_TO_MILES).toFixed(2)),
    date,
    moving_time_seconds: raw.moving_time ?? raw.elapsed_time ?? 0,
  }

  const score = Math.floor(new Date(date + "T00:00:00").getTime() / 1000)
  const pipeline = redis.pipeline()
  pipeline.zadd("activities:runs", { score, member: JSON.stringify(stored) })
  pipeline.sadd("activities:ids", raw.id)
  await pipeline.exec()

  return true
}

export async function syncNewRuns(): Promise<number> {
  const latest = await redis.zrange<string[]>("activities:runs", -1, -1)
  let oldest: string | undefined
  if (latest.length > 0) {
    const parsed = typeof latest[0] === "string" ? JSON.parse(latest[0]) : latest[0]
    oldest = parsed.date
  }

  const activities = await listActivities(oldest)

  let synced = 0
  for (const activity of activities) {
    if (await storeActivity(activity)) synced++
  }
  return synced
}