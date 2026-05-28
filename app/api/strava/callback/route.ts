import { NextRequest, NextResponse } from "next/server"
import { storeTokens } from "@/lib/strava"

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code")
  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 })
  }

  try {
    await storeTokens(code)
  } catch {
    return NextResponse.redirect(
      new URL("/strava/connect?error=token_exchange_failed", request.url)
    )
  }

  return NextResponse.redirect(new URL("/strava/connect?success=true", request.url))
}
