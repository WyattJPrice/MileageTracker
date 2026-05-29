import { NextRequest, NextResponse } from "next/server"
import { redis } from "@/lib/redis"
import { races } from "@/lib/races"

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret")
  if (secret !== process.env.STRAVA_ADMIN_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  await redis.set("races", races)
  return NextResponse.json({ seeded: races.length })
}
