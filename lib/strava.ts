import { redis } from "@/lib/redis"

const STRAVA_API_BASE = "https://www.strava.com/api/v3"
const STRAVA_TOKEN_URL = "https://www.strava.com/oauth/token"
const METERS_TO_MILES = 0.000621371

interface StravaTokenResponse {
  access_token: string
  refresh_token: string
  expires_at: number
}

interface StravaActivity {
  id: number
  name: string
  distance: number
  start_date: string
  start_date_local: string
  moving_time: number
  type: string
  description?: string | null
  average_heartrate?: number | null
  average_temp?: number | null
  average_weather_temp?: number | null
  average_feels_like?: number | null
  average_wind_speed?: number | null
  average_clouds?: number | null
  weather_summary?: string | null
}

interface StoredActivity {
  id: number
  name: string
  distance_miles: number
  date: string
  moving_time_seconds: number
}

export async function getAccessToken(): Promise<string> {
  const [token, expiresAt] = await Promise.all([
    redis.get<string>("strava:access_token"),
    redis.get<number>("strava:token_expires_at"),
  ])

  if (token && expiresAt && Date.now() / 1000 < expiresAt - 60) {
    return token
  }

  const refreshToken = await redis.get<string>("strava:refresh_token")
  if (!refreshToken) throw new Error("No Strava refresh token — visit /strava/connect first")

  const res = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  })

  if (!res.ok) throw new Error(`Token refresh failed: ${res.status}`)

  const data: StravaTokenResponse = await res.json()
  await Promise.all([
    redis.set("strava:access_token", data.access_token),
    redis.set("strava:refresh_token", data.refresh_token),
    redis.set("strava:token_expires_at", data.expires_at),
  ])

  return data.access_token
}

export async function storeTokens(code: string): Promise<void> {
  const res = await fetch(STRAVA_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code,
      grant_type: "authorization_code",
    }),
  })

  if (!res.ok) throw new Error(`Token exchange failed: ${res.status}`)

  const data: StravaTokenResponse = await res.json()
  await Promise.all([
    redis.set("strava:access_token", data.access_token),
    redis.set("strava:refresh_token", data.refresh_token),
    redis.set("strava:token_expires_at", data.expires_at),
  ])
}

export async function fetchActivityById(id: number): Promise<StravaActivity> {
  const token = await getAccessToken()
  const res = await fetch(`${STRAVA_API_BASE}/activities/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  if (!res.ok) throw new Error(`Fetch activity ${id} failed: ${res.status}`)
  return res.json()
}

export async function fetchRecentActivities(after?: number): Promise<StravaActivity[]> {
  const token = await getAccessToken()
  const all: StravaActivity[] = []
  let page = 1

  while (true) {
    const params = new URLSearchParams({ per_page: "200", page: String(page) })
    if (after) params.set("after", String(after))

    const res = await fetch(`${STRAVA_API_BASE}/athlete/activities?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!res.ok) throw new Error(`Fetch activities failed: ${res.status}`)

    const batch: StravaActivity[] = await res.json()
    const runs = batch.filter((a) => a.type === "Run")
    all.push(...runs)

    if (batch.length < 200) break
    page++
  }

  return all
}

function downsample(values: number[], targetCount = 180): number[] {
  if (values.length <= targetCount) return values
  const step = (values.length - 1) / (targetCount - 1)
  const sampled: number[] = []
  for (let i = 0; i < targetCount; i++) {
    sampled.push(values[Math.round(i * step)])
  }
  return sampled
}

export async function fetchActivityHrStream(id: number): Promise<number[] | null> {
  const token = await getAccessToken()
  const headers = { Authorization: "Bearer " + token }
  const res = await fetch(
    `${STRAVA_API_BASE}/activities/${id}/streams?keys=heartrate&key_by_type=true`,
    { headers }
  )
  if (!res.ok) throw new Error(`Fetch activity ${id} HR stream failed: ${res.status}`)

  const data: unknown = await res.json()
  const stream = (data as { heartrate?: { data?: unknown } })?.heartrate?.data
  if (!Array.isArray(stream)) return null

  const values = stream
    .map((value) => (typeof value === "number" ? value : NaN))
    .filter((value) => Number.isFinite(value) && value > 0)
  if (values.length === 0) return null

  return downsample(values)
}

export async function storeActivity(raw: StravaActivity): Promise<boolean> {
  const exists = await redis.sismember("activities:ids", raw.id)
  if (exists) return false

  const utcDate = new Date(raw.start_date)
  const localDateStr = raw.start_date_local
    ? raw.start_date_local.split("T")[0]
    : utcDate.toISOString().split("T")[0]

  const stored: StoredActivity = {
    id: raw.id,
    name: raw.name,
    distance_miles: parseFloat((raw.distance * METERS_TO_MILES).toFixed(2)),
    date: localDateStr,
    moving_time_seconds: raw.moving_time,
  }

  const score = Math.floor(utcDate.getTime() / 1000)
  const pipeline = redis.pipeline()
  pipeline.zadd("activities:runs", { score, member: JSON.stringify(stored) })
  pipeline.sadd("activities:ids", raw.id)
  await pipeline.exec()

  return true
}

export async function isConnected(): Promise<boolean> {
  const token = await redis.get("strava:refresh_token")
  return token !== null
}
