import fs from "fs"
import path from "path"
import { Redis } from "@upstash/redis"

interface StravaActivity {
  id: number
  name: string
  distance: number
  start_date: string
  moving_time: number
}

interface StoredActivity {
  id: number
  name: string
  distance_miles: number
  date: string
  moving_time_seconds: number
}

const METERS_TO_MILES = 0.000621371

async function seed() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    console.error("Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN in .env.local")
    process.exit(1)
  }

  const redis = new Redis({ url, token })

  const raw = fs.readFileSync(
    path.join(process.cwd(), "data", "activities.json"),
    "utf-8"
  )
  const activities: StravaActivity[] = JSON.parse(raw)

  await redis.del("activities:runs")

  const pipeline = redis.pipeline()

  for (const activity of activities) {
    const date = new Date(activity.start_date)
    const stored: StoredActivity = {
      id: activity.id,
      name: activity.name,
      distance_miles: parseFloat((activity.distance * METERS_TO_MILES).toFixed(2)),
      date: date.toISOString().split("T")[0],
      moving_time_seconds: activity.moving_time,
    }

    pipeline.zadd("activities:runs", {
      score: Math.floor(date.getTime() / 1000),
      member: JSON.stringify(stored),
    })
  }

  await pipeline.exec()

  const count = await redis.zcard("activities:runs")
  console.log(`Seeded ${count} activities into Upstash Redis`)
}

seed().catch(console.error)
