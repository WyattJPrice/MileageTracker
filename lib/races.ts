import type { Race } from "@/lib/types"

export const races: Race[] = [
  // 10th Grade Track Outdoor
  { date: "2026-04-23", event: "800m", time: "2:01.52", meet: "District" },
  { date: "2026-03-27", event: "800m", time: "2:01.30", meet: "BS Walker" },
  { date: "2026-03-13", event: "800m", time: "2:03.52", meet: "Pat Arceneaux" },
  { date: "2026-04-28", event: "1600m", time: "4:40.29", meet: "Regionals" },
  { date: "2026-04-23", event: "1600m", time: "4:51.54", meet: "District" },
  { date: "2026-04-11", event: "1600m", time: "4:27.09", meet: "LA Mile Festival" },
  { date: "2026-03-21", event: "1600m", time: "4:31.02", meet: "Pete Boudreaux" },
  { date: "2026-03-06", event: "1600m", time: "4:37.55", meet: "Cecilia" },
  { date: "2026-05-08", event: "3200m", time: "9:50.38", meet: "State" },
  { date: "2026-04-28", event: "3200m", time: "10:19.32", meet: "Regionals" },
  { date: "2026-04-23", event: "3200m", time: "11:06.38", meet: "District" },
  { date: "2026-04-16", event: "3200m", time: "9:29.49", meet: "Grizzly Relays" },
  { date: "2026-03-27", event: "3200m", time: "10:18.02", meet: "BS Walker" },
  { date: "2026-03-13", event: "3200m", time: "10:05.42", meet: "Pat Arceneaux Relay" },

  // 10th Grade Track Indoor
  { date: "2026-02-07", event: "400m", time: "56.73", meet: "LSU Last Chance Qualifier" },
  { date: "2026-02-07", event: "800m", time: "2:05.73", meet: "LSU Last Chance Qualifier" },
  { date: "2026-02-21", event: "1600m", time: "4:37.85", meet: "LHSAA State Indoor" },
  { date: "2026-01-24", event: "1600m", time: "4:43.74", meet: "LSU HS Qualifier" },

  // 10th Grade XC
  { date: "2025-11-17", event: "3 Mile", time: "17:23.30", meet: "LHSAA State" },
  { date: "2025-11-06", event: "3 Mile", time: "15:25.40", meet: "LHSAA Regionals" },
  { date: "2025-10-27", event: "3 Mile", time: "16:03.80", meet: "SOLA District" },
  { date: "2025-10-04", event: "3 Mile", time: "16:32.70", meet: "ESA Ain't No Shade in Cade" },
  { date: "2025-09-13", event: "3 Mile", time: "15:43.23", meet: "Episcopal Round Table Run" },
  { date: "2025-10-01", event: "3 Mile", time: "17:45.99", meet: "Bruin Invitational" },
  { date: "2025-10-18", event: "5K", time: "17:37.00", meet: "Rice Festival 5K" },

  // 9th Grade Track Outdoor
  { date: "2025-03-20", event: "800m", time: "2:11.66", meet: "Bronco Relays" },
  { date: "2025-04-29", event: "1600m", time: "4:46.12", meet: "Regionals" },
  { date: "2025-04-23", event: "1600m", time: "4:49.90", meet: "District" },
  { date: "2025-04-12", event: "1600m", time: "4:32.29", meet: "LA Mile Festival" },
  { date: "2025-04-04", event: "1600m", time: "4:44.18", meet: "Teurlings" },
  { date: "2025-03-20", event: "1600m", time: "4:38.13", meet: "Bronco Relays" },
  { date: "2025-03-14", event: "1600m", time: "4:44.36", meet: "Pat Arceneaux" },
  { date: "2025-03-07", event: "1600m", time: "4:45.73", meet: "Cecilia Bulldog Relays" },
  { date: "2025-06-19", event: "Mile", time: "4:32.60", meet: "NBNO" },
  { date: "2025-05-09", event: "3200m", time: "9:53.72", meet: "State" },
  { date: "2025-04-29", event: "3200m", time: "10:13.73", meet: "Regionals" },
  { date: "2025-04-23", event: "3200m", time: "10:36.11", meet: "District" },
  { date: "2025-04-16", event: "3200m", time: "9:48.14", meet: "Grizzly Relays" },
  { date: "2025-04-04", event: "3200m", time: "10:20.43", meet: "Teurlings Catholic Relays" },
  { date: "2025-03-20", event: "3200m", time: "10:20.03", meet: "Bronco Relays" },
  { date: "2025-03-14", event: "3200m", time: "10:41.00", meet: "Pat Arceneaux" },
  { date: "2025-06-20", event: "2 Mile", time: "10:02.62", meet: "NBNO" },

  // 9th Grade Track Indoor
  { date: "2025-02-08", event: "1600m", time: "4:53.59", meet: "LHSAA Last Chance Qualifier" },
  { date: "2025-02-01", event: "1600m", time: "4:57.84", meet: "McNeese Indoor II" },
  { date: "2025-02-01", event: "3200m", time: "11:03.97", meet: "McNeese Indoor II" },

  // 9th Grade XC
  { date: "2024-09-18", event: "2 Mile", time: "10:05.60", meet: "McNeese 2miler" },
  { date: "2024-11-18", event: "3 Mile", time: "17:03.09", meet: "State" },
  { date: "2024-10-28", event: "3 Mile", time: "16:24.28", meet: "District" },
  { date: "2024-10-12", event: "3 Mile", time: "16:33.58", meet: "CHS Pete Boudreaux" },
  { date: "2024-09-28", event: "3 Mile", time: "16:45.40", meet: "ESA Ain't No Shade in Cade" },
  { date: "2024-09-07", event: "3 Mile", time: "17:53.03", meet: "Bayou Boogie" },
  { date: "2024-11-07", event: "3 Mile", time: "15:59.60", meet: "Regionals" },

  // 8th Grade Track
  { date: "2024-03-27", event: "3200m", time: "11:03" },
  { date: "2024-05-07", event: "3200m", time: "11:51", meet: "League Championship" },
  { date: "2024-03-11", event: "3200m", time: "11:15" },
  { date: "2024-02-24", event: "1600m", time: "5:09", meet: "LA Classic Indoor" },
  { date: "2024-03-19", event: "1600m", time: "5:06" },
  { date: "2024-03-23", event: "1600m", time: "5:26" },
  { date: "2024-04-08", event: "1600m", time: "5:08" },
  { date: "2024-04-18", event: "1600m", time: "4:52", meet: "Erath" },
  { date: "2024-05-07", event: "1600m", time: "5:12", meet: "League Championship" },
  { date: "2024-04-16", event: "800m", time: "2:16" },
  { date: "2024-05-07", event: "800m", time: "2:17", meet: "League Championship" },

  // 8th Grade XC
  { date: "2023-08-28", event: "2 Mile", time: "11:50" },
  { date: "2023-09-27", event: "2 Mile", time: "12:38" },
  { date: "2023-10-07", event: "2 Mile", time: "11:36", meet: "Run for a Cure" },
  { date: "2023-10-18", event: "2 Mile", time: "11:09", meet: "Teurlings" },
  { date: "2023-11-06", event: "2 Mile", time: "11:48", meet: "Christian League Meet" },
  { date: "2023-11-11", event: "2 Mile", time: "11:21", meet: "Louisiana JH XC State" },
  { date: "2023-10-21", event: "5K", time: "19:34", meet: "Rice Fest" },
]
