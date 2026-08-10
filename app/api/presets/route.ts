import { NextRequest, NextResponse } from "next/server"
import { redis } from "@/lib/redis"
import type { NamedPreset } from "@/lib/types"

const KEY = "presets"

async function readAll(): Promise<NamedPreset[]> {
  const raw = await redis.hgetall<Record<string, NamedPreset>>(KEY)
  if (!raw) return []
  return Object.values(raw)
    .filter((p): p is NamedPreset => !!p?.id && !!p?.name && !!p?.from && !!p?.to)
    .sort((a, b) => a.name.localeCompare(b.name))
}

export async function GET() {
  return NextResponse.json(await readAll())
}

export async function POST(request: NextRequest) {
  let body: { name?: string; from?: string; to?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const name = body.name?.trim()
  const from = body.from
  const to = body.to

  if (!name || !from || !to || !/^\d{4}-\d{2}-\d{2}$/.test(from) || !/^\d{4}-\d{2}-\d{2}$/.test(to)) {
    return NextResponse.json(
      { error: "name, from, and to (yyyy-mm-dd) are required" },
      { status: 400 }
    )
  }

  const preset: NamedPreset = {
    id: crypto.randomUUID(),
    name,
    from,
    to,
  }

  await redis.hset(KEY, { [preset.id]: JSON.stringify(preset) })
  return NextResponse.json(preset)
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  await redis.hdel(KEY, id)
  return NextResponse.json({ ok: true })
}