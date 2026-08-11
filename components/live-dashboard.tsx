"use client"

import * as React from "react"
import { Suspense } from "react"
import { format, startOfWeek, endOfWeek, subWeeks } from "date-fns"
import { TodayCard } from "@/components/today-card"
import { TodayWorkoutCard } from "@/components/today-workout-card"
import { WeekRunsList } from "@/components/week-runs-list"
import { UpcomingCard } from "@/components/upcoming-card"
import { EightWeekChart } from "@/components/eight-week-chart"
import { DevToolbar } from "@/components/dev-toolbar"
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
  const [testRuns, setTestRuns] = React.useState<DetailedActivity[]>([])
  const [isLoadingTest, setIsLoadingTest] = React.useState(false)
  const handleTestLoading = React.useCallback((loading: boolean) => setIsLoadingTest(loading), [])
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

      fetch(`/api/ical?tz=${new Date().getTimezoneOffset()}`)
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

  const todayWorkoutEvents = upcoming.filter((e) => e.date === todayStr())
  const upcomingEvents = upcoming.filter((e) => e.date > todayStr())

  const displayTodayRuns = testRuns.length > 0 ? testRuns : todayRuns
  const hasTodayRun = displayTodayRuns.length > 0
  const todayLoading = isLoadingToday || isLoadingTest

  // When test runs are active, inject them into the week + chart data as
  // today-dated entries so they count toward the totals and the 8-week chart.
  const displayWeekRuns = React.useMemo(() => {
    if (testRuns.length === 0) return weekRuns
    const injected = testRuns.map((r) => ({ ...r, date: todayStr() } as Activity))
    return [...injected, ...weekRuns]
  }, [testRuns, weekRuns])

  const displayChartActivities = React.useMemo(() => {
    if (testRuns.length === 0) return chartActivities
    const injected = testRuns.map((r) => ({ ...r, date: todayStr() } as Activity))
    return [...injected, ...chartActivities]
  }, [testRuns, chartActivities])

  return (
    <div className="bg-zinc-950 flex flex-col p-4 lg:p-6 lg:h-[100dvh] lg:overflow-hidden">
      <div className="mx-auto w-full max-w-[1600px] flex flex-col flex-1 lg:min-h-0 lg:px-4">
        <header className="mb-4 lg:mb-5 shrink-0 flex items-center justify-between">
          <h1 className="text-base font-semibold tracking-tight text-zinc-300 lg:text-lg">
            Wyatt&apos;s Training
          </h1>
          {lastUpdated && (
            <div className="flex items-center gap-2 text-[11px] text-zinc-500">
              <span className="h-1.5 w-1.5 rounded-full bg-neon" />
              Updated {timeAgo(lastUpdated)}
            </div>
          )}
        </header>

        {/* Upper layout switches between two distinct designs based on whether a run is recorded today. */}

        {hasTodayRun ? (
          /* Run completed: 66/34 two-column. Today's Run is the dominant card on the left with
             This Week underneath; right column has a compact Today's Workout and tall Upcoming.
             Last 8 Weeks spans full width below. */
          <div className="flex flex-col gap-3.5 lg:flex-1 lg:min-h-0 lg:grid lg:grid-cols-[2fr_1fr] lg:gap-4">
            <div className="flex flex-col gap-3.5 lg:min-h-0">
              <div className="lg:flex-1 lg:min-h-0">
                <TodayCard runs={displayTodayRuns} isLoading={todayLoading} />
              </div>
              <div className="lg:h-[104px] lg:shrink-0">
                <WeekRunsList runs={displayWeekRuns} isLoading={isLoadingWeek} upcomingEvents={upcoming} />
              </div>
            </div>

            <div className="flex flex-col gap-3.5 lg:min-h-0">
              <div className="lg:h-[124px] lg:shrink-0">
                <TodayWorkoutCard
                  events={todayWorkoutEvents}
                  isLoading={isLoadingUpcoming}
                />
              </div>
              <div className="lg:flex-1 lg:min-h-0">
                <UpcomingCard events={upcomingEvents} isLoading={isLoadingUpcoming} />
              </div>
            </div>
          </div>
        ) : (
          /* No run: 2x2 grid. Today's Run + This Week on the top row, Today's Workout + Upcoming below.
             Row 1 shrinks to fit the This Week content so the big day numbers stay intact. */
          <div className="flex flex-col gap-3.5 lg:flex-1 lg:min-h-0 lg:grid lg:grid-cols-2 lg:grid-rows-[auto_1fr] lg:gap-3.5">
            <div className="lg:min-h-0">
              <TodayCard runs={displayTodayRuns} isLoading={todayLoading} />
            </div>
            <div className="lg:min-h-0">
              <WeekRunsList runs={displayWeekRuns} isLoading={isLoadingWeek} upcomingEvents={upcoming} />
            </div>
            <div className="lg:min-h-0">
              <TodayWorkoutCard
                events={todayWorkoutEvents}
                isLoading={isLoadingUpcoming}
                expanded
              />
            </div>
            <div className="lg:min-h-0">
              <UpcomingCard events={upcomingEvents} isLoading={isLoadingUpcoming} />
            </div>
          </div>
        )}

        <div className="mt-3.5 lg:h-[240px] lg:shrink-0 lg:mt-4">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-4 h-full flex flex-col">
            <p className="mb-2 shrink-0 text-xs font-medium uppercase tracking-wider text-zinc-500">
              Last 8 Weeks
            </p>
            {isLoadingChart ? (
              <div className="flex flex-1 items-center justify-center">
                <p className="text-sm text-zinc-600">Loading…</p>
              </div>
            ) : (
              <div className="flex-1 min-h-0">
                <EightWeekChart activities={displayChartActivities} />
              </div>
            )}
          </div>
        </div>
      </div>

      <Suspense fallback={null}>
        <DevToolbar
          testRuns={testRuns}
          onSelect={setTestRuns}
          onLoadingChange={handleTestLoading}
        />
      </Suspense>
    </div>
  )
}
