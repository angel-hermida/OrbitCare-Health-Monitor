// Daily check-in: how often each indicator should be measured, in hours.
// A reading older than this is "due": the dashboard shows it gray (DUE), never as OK.
// Edit these numbers to change the schedule. Used by engine/checkin.js.

export const CHECK_INTERVAL_HOURS = {
  heartRate: 24,
  bloodPressure: 24,
  bloodSugar: 24,
  temperature: 24,
  sleep: 24,
  mood: 24,
}
