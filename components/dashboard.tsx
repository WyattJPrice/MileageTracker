"use client"

import Link from "next/link"
import { MonitorPlay } from "lucide-react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { OverviewTab } from "@/components/overview-tab"
import { DetailedTab } from "@/components/detailed-tab"

export function Dashboard() {
  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8 lg:px-8 [@media(max-height:500px)]:py-2">
      <header className="mb-8 [@media(max-height:500px)]:mb-1">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 [@media(max-height:500px)]:text-sm">
            Wyatt&apos;s Mileage Tracker
          </h1>
          <Link
            href="/live"
            className="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
          >
            <MonitorPlay className="h-3.5 w-3.5" />
            Live
          </Link>
        </div>
        <p className="mt-1 text-sm text-zinc-500 [@media(max-height:500px)]:hidden">
          Analyze patterns over time
        </p>
      </header>

      <Tabs defaultValue="overview">
        <TabsList variant="line" className="mb-6 [@media(max-height:500px)]:mb-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>

        <TabsContent value="detailed">
          <DetailedTab />
        </TabsContent>
      </Tabs>
    </div>
  )
}
