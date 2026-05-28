"use client"

import * as React from "react"
import type { DateRange } from "react-day-picker"
import { Plus } from "lucide-react"
import { ChartPanel } from "@/components/chart-panel"

function makeDefaultRange(): DateRange {
  return { from: new Date("2025-05-24"), to: new Date("2026-05-23") }
}

let nextId = 1

interface PanelState {
  id: number
  range: DateRange | undefined
}

export function DetailedTab() {
  const [panels, setPanels] = React.useState<PanelState[]>([
    { id: nextId++, range: makeDefaultRange() },
  ])

  const updateRange = (id: number, range: DateRange | undefined) => {
    setPanels((prev) =>
      prev.map((p) => (p.id === id ? { ...p, range } : p))
    )
  }

  const addPanel = () => {
    setPanels((prev) => [...prev, { id: nextId++, range: makeDefaultRange() }])
  }

  const removePanel = (id: number) => {
    setPanels((prev) => prev.filter((p) => p.id !== id))
  }

  return (
    <div className="grid gap-8">
      {panels.map((panel) => (
        <ChartPanel
          key={panel.id}
          dateRange={panel.range}
          onDateRangeChange={(r) => updateRange(panel.id, r)}
          onRemove={
            panels.length > 1 ? () => removePanel(panel.id) : undefined
          }
        />
      ))}

      <button
        onClick={addPanel}
        className="group flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-zinc-700 py-4 text-sm text-zinc-500 transition-colors hover:border-zinc-500 hover:text-zinc-300"
      >
        <Plus className="h-4 w-4 transition-transform group-hover:scale-110" />
        Add chart
      </button>
    </div>
  )
}
