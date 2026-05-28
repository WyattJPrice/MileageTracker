import { NextRequest, NextResponse } from "next/server"
import { redis } from "@/lib/redis"

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const start = searchParams.get("start")
  const end = searchParams.get("end")

  if (!start || !end) {
    return NextResponse.json(
      { error: "start and end query params required" },
      { status: 400 }
    )
  }

  const startTs = Math.floor(new Date(start).getTime() / 1000)
  const endTs = Math.floor(new Date(end + "T23:59:59").getTime() / 1000)

  const results = await redis.zrange("activities:runs", startTs, endTs, {
    byScore: true,
  })

  return NextResponse.json(results)
}
