export interface Activity {
  id: number
  name: string
  distance_miles: number
  date: string
  moving_time_seconds: number
}

export interface DetailedActivity extends Activity {
  description?: string | null
  average_heartrate?: number | null
}

export interface ICalEvent {
  date: string
  summary: string
  description?: string
}

export interface Race {
  date: string
  event: string
  time: string
  meet?: string
}

export interface ChartDataPoint {
  label: string
  miles: number
  date: string
  races?: Race[]
}

export interface SeasonRange {
  type: "track" | "xc"
  label: string
  from: string
  to: string
}

export interface HighlightRange {
  x1: string
  x2: string
  color: string
}
