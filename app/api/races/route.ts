import { redis } from "@/lib/redis"
import { NextResponse } from "next/server"
import type { Race } from "@/lib/types"

export async function GET() {
  const races = (await redis.get<Race[]>("races")) ?? []
  return NextResponse.json([...races].sort((a, b) => a.date.localeCompare(b.date)))
}
