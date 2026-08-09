import { Redis } from "@upstash/redis"

const METERS_TO_MILES = 0.000621371
const MILE_METERS = 1609.344

const SECONDS_PER_MILE = [480, 420, 390, 405, 405]
const TOTAL_SECONDS = SECONDS_PER_MILE.reduce((s, p) => s + p, 0)

interface FakeDetail {
  description: string | null
  average_heartrate: number | null
  maximum_heartrate: number | null
  intervals: {
    id: number
    distance: number
    moving_time: number
    average_heartrate: number | null
    start_index: number
    end_index: number
  }[]
  stream: {
    heartrate: number[]
    distance: number[]
    time: number[]
  }
}

function localToday(): string {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${y}-${m}-${day}`
}

function generateHr(totalSeconds: number, step: number): number[] {
  const out: number[] = []
  for (let t = 0; t <= totalSeconds; t += step) {
    const min = t / 60
    let hr
    if (min < 4) {
      hr = 128 + (155 - 128) * (min / 4)
    } else if (min < 12) {
      hr = 155 + Math.sin(min * 0.9) * 4 + (Math.random() - 0.5) * 2
    } else if (min < 22) {
      hr = 163 + Math.sin(min * 0.7) * 5 + (Math.random() - 0.5) * 3
    } else if (min < 30) {
      hr = 171 + Math.sin(min * 0.8) * 4 + (Math.random() - 0.5) * 3
    } else if (min < 34) {
      hr = 177 + Math.sin(min * 1.2) * 3 + (Math.random() - 0.5) * 2
    } else {
      hr = 158 + Math.sin(min * 0.6) * 6 + (Math.random() - 0.5) * 3
    }
    out.push(Math.round(hr))
  }
  return out
}

function milesAt(t: number): number {
  let miles = 0
  let t0 = 0
  for (const pace of SECONDS_PER_MILE) {
    if (t <= t0 + pace) return miles + (t - t0) / pace
    miles += 1
    t0 += pace
  }
  return miles
}

async function main() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN
  if (!url || !token) {
    console.error("Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN in .env.local")
    process.exit(1)
  }

  const redis = new Redis({ url, token })

  const id = "fake-run-0001"
  const date = localToday()
  const distanceMiles = SECONDS_PER_MILE.length
  const step = 30
  const numPoints = Math.floor(TOTAL_SECONDS / step) + 1

  const hr = generateHr(TOTAL_SECONDS, step)
  const distance = Array.from({ length: numPoints }, (_, i) => milesAt(i * step) / METERS_TO_MILES)
  const time = Array.from({ length: numPoints }, (_, i) => i * step)

  const avgHr = Math.round(hr.reduce((s, h) => s + h, 0) / hr.length)
  const maxHr = Math.max(...hr)

  const intervals = SECONDS_PER_MILE.map((pace, k) => {
    const fromSec = SECONDS_PER_MILE.slice(0, k).reduce((s, p) => s + p, 0)
    const toSec = fromSec + pace
    const from = Math.round(fromSec / step)
    const to = Math.round(toSec / step)
    const slice = hr.slice(from, to + 1)
    return {
      id: k + 1,
      distance: MILE_METERS,
      moving_time: pace,
      average_heartrate: slice.length
        ? Math.round(slice.reduce((s, h) => s + h, 0) / slice.length)
        : null,
      start_index: from,
      end_index: to,
    }
  })

  const detail: FakeDetail = {
    description: "Fake 5 mile tempo run generated for local testing",
    average_heartrate: avgHr,
    maximum_heartrate: maxHr,
    intervals,
    stream: { heartrate: hr, distance, time },
  }

  const stored = {
    id,
    name: "Fake 5 Mile Tempo",
    distance_miles: distanceMiles,
    date,
    moving_time_seconds: TOTAL_SECONDS,
  }
  const score = Math.floor(new Date(date + "T00:00:00").getTime() / 1000)

  const pipeline = redis.pipeline()
  pipeline.zadd("activities:runs", { score, member: JSON.stringify(stored) })
  pipeline.sadd("activities:ids", id)
  pipeline.set(`activities:detail:${id}`, detail, { ex: 30 * 60 })
  await pipeline.exec()

  console.log(`Seeded fake run for ${date}`)
  console.log(`  ${distanceMiles} mi in ${TOTAL_SECONDS}s (${(TOTAL_SECONDS / 60).toFixed(1)} min), avg HR ${avgHr} bpm, max HR ${maxHr} bpm`)
  console.log(`  per-mile paces: ${SECONDS_PER_MILE.map((p) => `${Math.floor(p / 60)}:${String(p % 60).padStart(2, "0")}`).join(", ")}`)
  console.log(`  ${numPoints} HR samples, ${intervals.length} split intervals`)
}

main().catch(console.error)