import { NextResponse } from "next/server"
import { getDetailedActivity } from "@/lib/intervals"

export const dynamic = "force-dynamic"

// Dev-only: returns a full DetailedActivity for a past run so it can be shown
// as "today's run" in the test toolbar.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  const { id } = await params

  try {
    const detail = await getDetailedActivity(id)
    return NextResponse.json(detail)
  } catch (err) {
    console.error(`Dev activity ${id} fetch error:`, err)
    return NextResponse.json({ error: "Failed to fetch activity" }, { status: 500 })
  }
}
