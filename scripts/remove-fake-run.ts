import { redis } from "../lib/redis"

async function main() {
  const members = await redis.zrange("activities:runs", 0, -1)
  console.log("total runs in zset:", members.length)
  for (const m of members) {
    const a = typeof m === "string" ? JSON.parse(m) : m
    console.log(`  ${a.id} ${a.date} "${a.name}"`)
  }

  const ids = await redis.smembers("activities:ids")
  console.log("activities:ids set:", ids)

  const keys = await redis.keys("activities:detail:*")
  console.log("detail keys:", keys)

  const fakeMember = members.find((m) => {
    const a = typeof m === "string" ? JSON.parse(m) : m
    return a.id === "fake-run-0001"
  })
  console.log("found fake member:", Boolean(fakeMember))

  if (fakeMember) {
    const removedZset = await redis.zrem("activities:runs", fakeMember as string | number)
    console.log("removed from zset:", removedZset === 1)
  }

  const removedIds = await redis.srem("activities:ids", "fake-run-0001")
  console.log("removed from ids set:", removedIds === 1)

  const removedDetail = await redis.del("activities:detail:fake-run-0001")
  console.log("deleted detail key:", removedDetail === 1)

  const after = await redis.zrange("activities:runs", 0, -1)
  console.log("runs after cleanup:", after.length)
  for (const m of after) {
    const a = typeof m === "string" ? JSON.parse(m) : m
    console.log(`  ${a.id} ${a.date} "${a.name}"`)
  }
}

main().catch(console.error)