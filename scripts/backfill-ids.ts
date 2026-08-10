import { Redis } from "@upstash/redis"

async function backfill() {
  const url = process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token) {
    console.error("Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN")
    process.exit(1)
  }

  const redis = new Redis({ url, token })

  const members = await redis.zrange("activities:runs", 0, -1)
  if (members.length === 0) {
    console.log("No activities found in Redis")
    return
  }

  const pipeline = redis.pipeline()
  let count = 0

  for (const member of members) {
    const activity = typeof member === "string" ? JSON.parse(member) : member
    if (activity.id) {
      pipeline.sadd("activities:ids", String(activity.id))
      count++
    }
  }

  await pipeline.exec()
  console.log(`Backfilled ${count} activity IDs into activities:ids`)
}

backfill().catch(console.error)
