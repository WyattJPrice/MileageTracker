import { NextRequest, NextResponse } from "next/server"
import { ensureSynced } from "@/lib/intervals"

export async function POST(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get("secret")
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    await ensureSynced()
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Intervals sync error:", err)
    return NextResponse.json({ error: "Sync failed" }, { status: 500 })
  }
}