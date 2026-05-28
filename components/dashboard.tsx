"use client"

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { OverviewTab } from "@/components/overview-tab"
import { DetailedTab } from "@/components/detailed-tab"

export function Dashboard() {
  return (
    <div className="mx-auto max-w-[1400px] px-6 py-8 lg:px-8">
      <header className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-100">
          Wyatt's Mileage Tracker
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Analyze patterns over time
        </p>
      </header>

      <Tabs defaultValue="overview">
        <TabsList variant="line" className="mb-6">
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
