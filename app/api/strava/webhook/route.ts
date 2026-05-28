import { NextRequest, NextResponse } from "next/server"
import { fetchActivityById, storeActivity } from "@/lib/strava"

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const mode = params.get("hub.mode")
  const token = params.get("hub.verify_token")
  const challenge = params.get("hub.challenge")

  if (mode === "subscribe" && token === process.env.STRAVA_WEBHOOK_VERIFY_TOKEN) {
    return NextResponse.json({ "hub.challenge": challenge })
  }

  return NextResponse.json({ error: "Forbidden" }, { status: 403 })
}

interface WebhookEvent {
  aspect_type: string
  object_id: number
  object_type: string
  owner_id: number
  subscription_id: number
}

export async function POST(request: NextRequest) {
  const event: WebhookEvent = await request.json()

  if (event.object_type !== "activity" || event.aspect_type !== "create") {
    return NextResponse.json({ ok: true })
  }

  try {
    const activity = await fetchActivityById(event.object_id)
    if (activity.type === "Run") {
      await storeActivity(activity)
    }
  } catch (err) {
    console.error("Webhook processing error:", err)
  }

  return NextResponse.json({ ok: true })
}
