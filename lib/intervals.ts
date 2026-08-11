import { format, subDays } from "date-fns"
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

const MAX_ATTEMPTS = 4

function authHeaders(): Record<string, string> {
  const key = process.env.INTERVALS_API_KEY
  if (!key) throw new Error("Missing INTERVALS_API_KEY in .env.local")
  return {
    Authorization: `Basic ${Buffer.from(`API_KEY:${key}`).toString("base64")}`,
  }
}

async function fetchIntervals(url: string): Promise<Response> {
  for (let attempt = 1; ; attempt++) {
    const res = await fetch(url, {
      headers: authHeaders(),
      cache: "no-store",
    })

    if (res.status !== 429 || attempt >= MAX_ATTEMPTS) return res

    const retryAfter = Number(res.headers.get("retry-after"))
    const waitMs = Number.isFinite(retryAfter) ? retryAfter * 1000 : 15_000
    await new Promise((r) => setTimeout(r, waitMs))
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

    const res = await fetchIntervals(
      `${API_BASE}/athlete/${ATHLETE_ID}/activities?${params}`
    )
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
  const res = await fetchIntervals(`${API_BASE}/activity/${id}?intervals=true`)
  if (!res.ok) throw new Error(`Fetch activity ${id} failed: ${res.status}`)
  return res.json()
}

export async function getStreams(id: string): Promise<ActivityStream> {
  const res = await fetchIntervals(
    `${API_BASE}/activity/${id}/streams.json?types=time,heartrate,distance`
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

const SYNC_LOCK_KEY = "intervals:sync:lock"
const SYNC_LAST_RUN_KEY = "intervals:sync:last"
const SYNC_MIN_INTERVAL_MS = 60_000
const SYNC_LOCK_TTL_SECONDS = 120
const SYNC_WAIT_TIMEOUT_MS = 30_000

async function acquireSyncLock(): Promise<boolean> {
  const deadline = Date.now() + SYNC_WAIT_TIMEOUT_MS
  while (Date.now() < deadline) {
    const lock = await redis.set(SYNC_LOCK_KEY, "1", {
      nx: true,
      ex: SYNC_LOCK_TTL_SECONDS,
    })
    if (lock === "OK") return true
    await new Promise((r) => setTimeout(r, 200))
  }
  return false
}

/**
 * Throttled, concurrency-safe sync entry point.
 *
 * At most one sync runs at a time. Concurrent callers wait for the in-flight
 * sync to finish (up to a timeout) instead of reading stale data, so a run and
 * a chart requested at the same moment both see fresh data. At most one sync
 * runs per minute. Failures are logged and re-attempted by the next caller
 * once the cooldown elapses.
 */
export async function ensureSynced(): Promise<void> {
  const last = await redis.get<number>(SYNC_LAST_RUN_KEY)
  if (last && Date.now() - last < SYNC_MIN_INTERVAL_MS) return

  if (!(await acquireSyncLock())) return // timed out waiting; caller reads what's there

  try {
    // A sync may have completed while we waited for the lock; no need to rerun.
    const refreshed = await redis.get<number>(SYNC_LAST_RUN_KEY)
    if (refreshed && Date.now() - refreshed < SYNC_MIN_INTERVAL_MS) return

    await syncNewRuns()
  } catch (err) {
    console.error("Intervals sync failed:", err)
  } finally {
    await redis.del(SYNC_LOCK_KEY)
    await redis.set(SYNC_LAST_RUN_KEY, Date.now())
  }
}

export async function syncNewRuns(): Promise<number> {
  const latest = await redis.zrange<string[]>("activities:runs", -1, -1)
  const today = format(new Date(), "yyyy-MM-dd")
  const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd")

  // Sync from the earliest of (newest stored run, yesterday) so a run uploaded
  // today is always in scope even when the newest stored run is also dated
  // today, and so timezone differences never exclude today's activity.
  let oldest = today
  if (latest.length > 0) {
    const parsed = typeof latest[0] === "string" ? JSON.parse(latest[0]) : latest[0]
    if (parsed.date < oldest) oldest = parsed.date
  }
  if (yesterday < oldest) oldest = yesterday

  const activities = await listActivities(oldest)

  let synced = 0
  for (const activity of activities) {
    if (await storeActivity(activity)) synced++
  }
  return synced
}