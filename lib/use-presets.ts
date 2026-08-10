"use client"

import * as React from "react"
import type { NamedPreset } from "@/lib/types"

interface UsePresetsResult {
  presets: NamedPreset[]
  isLoading: boolean
  reload: () => Promise<void>
  savePreset: (name: string, from: string, to: string) => Promise<boolean>
  deletePreset: (id: string) => Promise<void>
}

export function usePresets(): UsePresetsResult {
  const [presets, setPresets] = React.useState<NamedPreset[]>([])
  const [isLoading, setIsLoading] = React.useState(true)

  const reload = React.useCallback(async () => {
    try {
      const res = await fetch("/api/presets")
      if (res.ok) setPresets(await res.json())
    } catch {
      // keep previous saved list on failure
    } finally {
      setIsLoading(false)
    }
  }, [])

  React.useEffect(() => {
    let active = true
    fetch("/api/presets")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => {
        if (active) setPresets(data as NamedPreset[])
      })
      .catch(() => {})
      .finally(() => {
        if (active) setIsLoading(false)
      })
    return () => {
      active = false
    }
  }, [])

  const savePreset = React.useCallback(
    async (name: string, from: string, to: string) => {
      const res = await fetch("/api/presets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, from, to }),
      })
      if (!res.ok) return false
      await reload()
      return true
    },
    [reload]
  )

  const deletePreset = React.useCallback(
    async (id: string) => {
      await fetch(`/api/presets?id=${id}`, { method: "DELETE" })
      await reload()
    },
    [reload]
  )

  return { presets, isLoading, reload, savePreset, deletePreset }
}