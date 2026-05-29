import type { Metadata } from "next"
import { LiveDashboard } from "@/components/live-dashboard"

export const metadata: Metadata = {
  title: "Live — Wyatt's Mileage",
}

export default function LivePage() {
  return <LiveDashboard />
}
