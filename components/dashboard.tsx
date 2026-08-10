"use client"

import * as React from "react"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { OverviewTab } from "@/components/overview-tab"
import { DetailedTab } from "@/components/detailed-tab"

export interface DashboardProps {
  initialTab?: "overview" | "detailed" | null
  initialView?: string | null
}

export function Dashboard({
  initialTab = null,
  initialView = null,
}: DashboardProps) {
  const [activeTab, setActiveTab] = React.useState<string>(
    initialTab ?? "overview"
  )

  return (
    <div className="mx-auto max-w-[1400px] px-6 py-4 lg:px-8 [@media(max-height:500px)]:py-2">
      <header className="mb-3 [@media(max-height:500px)]:mb-1">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-100 [@media(max-height:500px)]:text-sm">
            Wyatt&apos;s Mileage Tracker
          </h1>
        </div>
      </header>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList variant="line" className="mb-3 [@media(max-height:500px)]:mb-1">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="detailed">Detailed</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <OverviewTab />
        </TabsContent>

        <TabsContent value="detailed">
          <DetailedTab initialView={initialView} />
        </TabsContent>
      </Tabs>
    </div>
  )
}