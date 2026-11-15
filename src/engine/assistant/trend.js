// Trend and short forecast for one indicator. No React. Used by the AI assistant tools.
//
// Method: ordinary least-squares straight line through the measured values of the last
// `windowDays` days (x = days, y = value), then:
//   - slope per day with a 95% confidence interval (t distribution, n - 2 degrees of freedom)
//   - "rising" / "falling" only when that interval does not include 0; otherwise "stable / no clear trend"
//   - forecast at `horizonDays` ahead with a 95% prediction interval
// Guards against unreliable output:
//   - fewer than MIN_POINTS readings -> no trend, reason given
//   - horizon is capped at half the window, so the line is never stretched far past the data
// Every number this returns is either MEASURED (copied from a reading) or ESTIMATED (from the line).

const DAY = 24 * 60 * 60 * 1000
export const MIN_POINTS = 5

// Two-sided 95% t values by degrees of freedom (1..30); above 30 use 1.96 + small correction.
const T95 = [12.706, 4.303, 3.182, 2.776, 2.571, 2.447, 2.365, 2.306, 2.262, 2.228, 2.201, 2.179, 2.16, 2.145, 2.131, 2.12, 2.11, 2.101, 2.093, 2.086, 2.08, 2.074, 2.069, 2.064, 2.06, 2.056, 2.052, 2.048, 2.045, 2.042]
const t95 = (df) => (df <= 30 ? T95[df - 1] : 1.96 + 2.4 / df)

const round = (n, d = 2) => Math.round(n * 10 ** d) / 10 ** d

// points: [{ t: timestamp, y: number }] oldest first.
export function linearTrend(points, { horizonDays = 3, now = Date.now() } = {}) {
  const n = points.length
  if (n < MIN_POINTS) {
    return { ok: false, reason: `Only ${n} reading${n === 1 ? '' : 's'} in the window. At least ${MIN_POINTS} are needed for a trend.` }
  }
  const xs = points.map((p) => (p.t - now) / DAY) // days, negative = past, 0 = now
  const ys = points.map((p) => p.y)
  const mx = xs.reduce((a, b) => a + b, 0) / n
  const my = ys.reduce((a, b) => a + b, 0) / n
  let sxx = 0
  let sxy = 0
  for (let i = 0; i < n; i++) {
    sxx += (xs[i] - mx) ** 2
    sxy += (xs[i] - mx) * (ys[i] - my)
  }
  if (sxx === 0) return { ok: false, reason: 'All readings have the same time. A trend needs readings spread over time.' }
  const slope = sxy / sxx
  const intercept = my - slope * mx
  let sse = 0
  for (let i = 0; i < n; i++) sse += (ys[i] - (intercept + slope * xs[i])) ** 2
  const df = n - 2
  const s = Math.sqrt(sse / df) // residual standard error
  const tc = t95(df)
  const slopeSe = s / Math.sqrt(sxx)
  const slopeCi = [slope - tc * slopeSe, slope + tc * slopeSe]
  const direction = slopeCi[0] > 0 ? 'rising' : slopeCi[1] < 0 ? 'falling' : 'no clear trend'

  const spanDays = xs[n - 1] - xs[0]
  const horizon = Math.max(0, Math.min(horizonDays, spanDays / 2))
  const x0 = horizon
  const forecast = intercept + slope * x0
  const predSe = s * Math.sqrt(1 + 1 / n + (x0 - mx) ** 2 / sxx)
  return {
    ok: true,
    method: 'Least-squares linear trend, 95% intervals (t distribution)',
    points: n,
    spanDays: round(spanDays, 1),
    slopePerDay: round(slope),
    slopePerDayCi95: slopeCi.map((v) => round(v)),
    direction,
    residualSd: round(s),
    forecast: {
      label: 'ESTIMATED',
      horizonDays: round(horizon, 1),
      atTimestamp: now + horizon * DAY,
      value: round(forecast, 1),
      predictionInterval95: [round(forecast - tc * predSe, 1), round(forecast + tc * predSe, 1)],
    },
    horizonCapped: horizon < horizonDays,
  }
}

// Mean of a list of numbers (null for an empty list).
export const mean = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null)

export { DAY }
