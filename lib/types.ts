export interface Activity {
  id: string
  name: string
  distance_miles: number
  date: string
  moving_time_seconds: number
}

export interface ActivityInterval {
  id: number
  distance: number
  moving_time: number
  average_heartrate?: number | null
  start_index: number
  end_index: number
}

export interface ActivityStream {
  heartrate: number[]
  distance: number[]
  time: number[]
}

export interface DetailedActivity extends Activity {
  description?: string | null
  average_heartrate?: number | null
  maximum_heartrate?: number | null
  intervals?: ActivityInterval[]
  stream?: ActivityStream
}

export interface NamedPreset {
  id: string
  name: string
  from: string
  to: string
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
