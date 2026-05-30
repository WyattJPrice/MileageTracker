"use client"

import * as React from "react"
import { format, startOfWeek, endOfWeek, subWeeks, addDays } from "date-fns"
import { TodayCard } from "@/components/today-card"
import { TodayWorkoutCard } from "@/components/today-workout-card"
import { WeekRunsList } from "@/components/week-runs-list"
import { UpcomingCard } from "@/components/upcoming-card"
import { EightWeekChart } from "@/components/eight-week-chart"
import type { Activity, DetailedActivity, ICalEvent } from "@/lib/types"

function todayStr() {
  return format(new Date(), "yyyy-MM-dd")
}

function weekRange() {
  const now = new Date()
  const start = format(startOfWeek(now, { weekStartsOn: 0 }), "yyyy-MM-dd")
  const end = format(endOfWeek(now, { weekStartsOn: 0 }), "yyyy-MM-dd")
  return { start, end }
}

function chartRange() {
  const now = new Date()
  const thisWeekStart = startOfWeek(now, { weekStartsOn: 0 })
  const start = format(subWeeks(thisWeekStart, 7), "yyyy-MM-dd")
  const end = format(now, "yyyy-MM-dd")
  return { start, end }
}

function timeAgo(date: Date): string {
  const mins = Math.floor((Date.now() - date.getTime()) / 60_000)
  if (mins < 1) return "just now"
  if (mins === 1) return "1 min ago"
  return `${mins} min ago`
}

export function LiveDashboard() {
  const [todayRuns, setTodayRuns] = React.useState<DetailedActivity[]>([])
  const [weekRuns, setWeekRuns] = React.useState<Activity[]>([])
  const [upcoming, setUpcoming] = React.useState<ICalEvent[]>([])
  const [chartActivities, setChartActivities] = React.useState<Activity[]>([])
  const [isLoadingToday, setIsLoadingToday] = React.useState(true)
  const [isLoadingWeek, setIsLoadingWeek] = React.useState(true)
  const [isLoadingUpcoming, setIsLoadingUpcoming] = React.useState(true)
  const [isLoadingChart, setIsLoadingChart] = React.useState(true)
  const [lastUpdated, setLastUpdated] = React.useState<Date | null>(null)

  const fetchAll = React.useCallback(async () => {
    const today = todayStr()
    const { start: weekStart, end: weekEnd } = weekRange()
    const { start: chartStart, end: chartEnd } = chartRange()

    await Promise.allSettled([
      fetch(`/api/today?date=${today}`)
        .then((r) => r.json())
        .then((d) => { setTodayRuns(d); setIsLoadingToday(false) })
        .catch(() => setIsLoadingToday(false)),

      fetch(`/api/activities?start=${weekStart}&end=${weekEnd}`)
        .then((r) => r.json())
        .then((d) => { setWeekRuns(d); setIsLoadingWeek(false) })
        .catch(() => setIsLoadingWeek(false)),

      fetch("/api/ical")
        .then((r) => r.json())
        .then((d) => { setUpcoming(d); setIsLoadingUpcoming(false) })
        .catch(() => setIsLoadingUpcoming(false)),

      fetch(`/api/activities?start=${chartStart}&end=${chartEnd}`)
        .then((r) => r.json())
        .then((d) => { setChartActivities(d); setIsLoadingChart(false) })
        .catch(() => setIsLoadingChart(false)),
    ])

    setLastUpdated(new Date())
  }, [])

  React.useEffect(() => {
    fetchAll()
    const interval = setInterval(fetchAll, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [fetchAll])

  const [, forceUpdate] = React.useReducer((x: number) => x + 1, 0)
  React.useEffect(() => {
    const interval = setInterval(forceUpdate, 30_000)
    return () => clearInterval(interval)
  }, [])

  const tomorrowStr = format(addDays(new Date(), 1), "yyyy-MM-dd")

  // If Final Surge shifts today's completed workout to tomorrow, pull it back into
  // the Today's Workout section (only when runs were already logged today).
  const todayWorkoutEvents = React.useMemo(() => {
    const todayEvents = upcoming.filter((e) => e.date === todayStr())
    if (todayEvents.length > 0) return todayEvents
    if (todayRuns.length > 0) {
      return upcoming.filter((e) => e.date === tomorrowStr)
    }
    return []
  }, [upcoming, todayRuns, tomorrowStr])

  const upcomingEvents = React.useMemo(() => {
    const pulledToToday = new Set(todayWorkoutEvents.filter((e) => e.date === tomorrowStr).map((e) => e.summary))
    return upcoming.filter(
      (e) => e.date > todayStr() && !pulledToToday.has(e.summary)
    )
  }, [upcoming, todayWorkoutEvents, tomorrowStr])

  return (
    <div className="h-[100dvh] overflow-hidden bg-zinc-950 flex flex-col p-4 lg:p-6">
      <div className="mx-auto w-full max-w-[1600px] flex flex-col flex-1 min-h-0">
        <header className="mb-3 shrink-0 flex items-center justify-between">
          <h1 className="text-base font-semibold tracking-tight text-zinc-300 lg:text-lg">
            Wyatt&apos;s Training
          </h1>
          <div className="flex items-center gap-2 text-xs text-zinc-600">
            {lastUpdated && (
              <>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-50" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                </span>
                Updated {timeAgo(lastUpdated)}
              </>
            )}
          </div>
        </header>

        {/* Desktop: 3×3 equal grid filling remaining height. Mobile: normal scroll. */}
        <div className="flex-1 min-h-0 grid grid-cols-1 gap-3 lg:grid-cols-3 lg:grid-rows-[minmax(0,1fr)_auto_minmax(0,1fr)]">
          <div className="lg:col-start-1 lg:row-start-1 h-full">
            <TodayCard runs={todayRuns} isLoading={isLoadingToday} />
          </div>

          <div className="lg:col-start-2 lg:row-start-1 h-full">
            <TodayWorkoutCard
              events={todayWorkoutEvents}
              isLoading={isLoadingUpcoming}
            />
          </div>

          <div className="lg:col-start-3 lg:row-start-1 lg:row-span-2 h-full">
            <UpcomingCard
              events={upcomingEvents}
              isLoading={isLoadingUpcoming}
            />
          </div>

          <div className="lg:col-start-1 lg:col-span-2 lg:row-start-2 h-full">
            <WeekRunsList runs={weekRuns} isLoading={isLoadingWeek} />
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 lg:col-span-3 lg:row-start-3 h-full flex flex-col">
            <p className="mb-2 shrink-0 text-xs font-medium uppercase tracking-wider text-zinc-500">
              Last 8 Weeks
            </p>
            {isLoadingChart ? (
              <div className="flex flex-1 items-center justify-center">
                <p className="text-sm text-zinc-600">Loading…</p>
              </div>
            ) : (
              <div className="flex-1 min-h-0">
                <EightWeekChart activities={chartActivities} />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
