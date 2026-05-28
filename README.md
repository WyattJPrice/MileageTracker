# Mileage Tracker

A personal running dashboard built with Next.js that visualizes weekly mileage from Strava. Features multiple independent charts with custom date ranges, season overlays for track and cross country, and race markers with detailed tooltips.

Data is seeded from Strava into Upstash Redis and queried by date range. Weekly mileage is aggregated Sunday through Saturday.

## Race Results (8th Grade XC through 10th Grade Track)

### 8th Grade Cross Country (Aug 2023 - Nov 2023)

| Date | Event | Time | Meet |
|------|-------|------|------|
| Aug 28, 2023 | 2 Mile | 11:50 | |
| Sep 27, 2023 | 2 Mile | 12:38 | |
| Oct 7, 2023 | 2 Mile | 11:36 | Run for a Cure |
| Oct 18, 2023 | 2 Mile | 11:09 | Teurlings |
| Oct 21, 2023 | 5K | 19:34 | Rice Fest |
| Nov 6, 2023 | 2 Mile | 11:48 | Christian League Meet |
| Nov 11, 2023 | 2 Mile | 11:21 | Louisiana JH XC State |

### 8th Grade Track (Feb 2024 - May 2024)

| Date | Event | Time | Meet |
|------|-------|------|------|
| Feb 24, 2024 | 1600m | 5:09 | LA Classic Indoor |
| Mar 11, 2024 | 3200m | 11:15 | |
| Mar 19, 2024 | 1600m | 5:06 | |
| Mar 23, 2024 | 1600m | 5:26 | |
| Mar 27, 2024 | 3200m | 11:03 | |
| Apr 8, 2024 | 1600m | 5:08 | |
| Apr 16, 2024 | 800m | 2:16 | |
| Apr 18, 2024 | 1600m | 4:52 | Erath |
| May 7, 2024 | 800m | 2:17 | League Championship |
| May 7, 2024 | 1600m | 5:12 | League Championship |
| May 7, 2024 | 3200m | 11:51 | League Championship |

### 9th Grade Cross Country (Sep 2024 - Nov 2024)

| Date | Event | Time | Meet |
|------|-------|------|------|
| Sep 7, 2024 | 3 Mile | 17:53.03 | Bayou Boogie |
| Sep 18, 2024 | 2 Mile | 10:05.60 | McNeese 2miler |
| Sep 28, 2024 | 3 Mile | 16:45.40 | ESA Ain't No Shade in Cade |
| Oct 12, 2024 | 3 Mile | 16:33.58 | CHS Pete Boudreaux |
| Oct 28, 2024 | 3 Mile | 16:24.28 | District |
| Nov 7, 2024 | 3 Mile | 15:59.60 | Regionals |
| Nov 18, 2024 | 3 Mile | 17:03.09 | State |

### 9th Grade Track Indoor (Feb 2025)

| Date | Event | Time | Meet |
|------|-------|------|------|
| Feb 1, 2025 | 1600m | 4:57.84 | McNeese Indoor II |
| Feb 1, 2025 | 3200m | 11:03.97 | McNeese Indoor II |
| Feb 8, 2025 | 1600m | 4:53.59 | LHSAA Last Chance Qualifier |

### 9th Grade Track Outdoor (Mar 2025 - Jun 2025)

| Date | Event | Time | Meet |
|------|-------|------|------|
| Mar 7, 2025 | 1600m | 4:45.73 | Cecilia Bulldog Relays |
| Mar 14, 2025 | 1600m | 4:44.36 | Pat Arceneaux |
| Mar 14, 2025 | 3200m | 10:41.00 | Pat Arceneaux |
| Mar 20, 2025 | 800m | 2:11.66 | Bronco Relays |
| Mar 20, 2025 | 1600m | 4:38.13 | Bronco Relays |
| Mar 20, 2025 | 3200m | 10:20.03 | Bronco Relays |
| Apr 4, 2025 | 1600m | 4:44.18 | Teurlings |
| Apr 4, 2025 | 3200m | 10:20.43 | Teurlings Catholic Relays |
| Apr 12, 2025 | 1600m | 4:32.29 | LA Mile Festival |
| Apr 16, 2025 | 3200m | 9:48.14 | Grizzly Relays |
| Apr 23, 2025 | 1600m | 4:49.90 | District |
| Apr 23, 2025 | 3200m | 10:36.11 | District |
| Apr 29, 2025 | 1600m | 4:46.12 | Regionals |
| Apr 29, 2025 | 3200m | 10:13.73 | Regionals |
| May 9, 2025 | 3200m | 9:53.72 | State |
| Jun 19, 2025 | Mile | 4:32.60 | NBNO |
| Jun 20, 2025 | 2 Mile | 10:02.62 | NBNO |

### 10th Grade Cross Country (Sep 2025 - Nov 2025)

| Date | Event | Time | Meet |
|------|-------|------|------|
| Sep 13, 2025 | 3 Mile | 15:43.23 | Episcopal Round Table Run |
| Oct 1, 2025 | 3 Mile | 17:45.99 | Bruin Invitational |
| Oct 4, 2025 | 3 Mile | 16:32.70 | ESA Ain't No Shade in Cade |
| Oct 18, 2025 | 5K | 17:37.00 | Rice Festival 5K |
| Oct 27, 2025 | 3 Mile | 16:03.80 | SOLA District |
| Nov 6, 2025 | 3 Mile | 15:25.40 | LHSAA Regionals |
| Nov 17, 2025 | 3 Mile | 17:23.30 | LHSAA State |

### 10th Grade Track Indoor (Jan 2026 - Feb 2026)

| Date | Event | Time | Meet |
|------|-------|------|------|
| Jan 24, 2026 | 1600m | 4:43.74 | LSU HS Qualifier |
| Feb 7, 2026 | 400m | 56.73 | LSU Last Chance Qualifier |
| Feb 7, 2026 | 800m | 2:05.73 | LSU Last Chance Qualifier |
| Feb 21, 2026 | 1600m | 4:37.85 | LHSAA State Indoor |

### 10th Grade Track Outdoor (Mar 2026 - May 2026)

| Date | Event | Time | Meet |
|------|-------|------|------|
| Mar 6, 2026 | 1600m | 4:37.55 | Cecilia |
| Mar 13, 2026 | 800m | 2:03.52 | Pat Arceneaux |
| Mar 13, 2026 | 3200m | 10:05.42 | Pat Arceneaux Relay |
| Mar 21, 2026 | 1600m | 4:31.02 | Pete Boudreaux |
| Mar 27, 2026 | 800m | 2:01.30 | BS Walker |
| Mar 27, 2026 | 3200m | 10:18.02 | BS Walker |
| Apr 11, 2026 | 1600m | 4:27.09 | LA Mile Festival |
| Apr 16, 2026 | 3200m | 9:29.49 | Grizzly Relays |
| Apr 23, 2026 | 800m | 2:01.52 | District |
| Apr 23, 2026 | 1600m | 4:51.54 | District |
| Apr 23, 2026 | 3200m | 11:06.38 | District |
| Apr 28, 2026 | 1600m | 4:40.29 | Regionals |
| Apr 28, 2026 | 3200m | 10:19.32 | Regionals |
| May 8, 2026 | 3200m | 9:50.38 | State |
