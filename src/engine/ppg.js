// Heart-rate estimate from camera brightness (remote photoplethysmography).
// Pure functions, no React. Input: [{ t: ms, v: mean green value }].
// Runs on the device. No network, no stored video.

export const FS = 30 // analysis rate, Hz
export const MIN_SECONDS = 15
const BAND = [0.7, 3.0] // 42 to 180 bpm

function resample(samples) {
  const t0 = samples[0].t
  const n = Math.floor(((samples[samples.length - 1].t - t0) / 1000) * FS)
  const out = new Array(n)
  let j = 0
  for (let i = 0; i < n; i++) {
    const t = t0 + (i * 1000) / FS
    while (j < samples.length - 2 && samples[j + 1].t < t) j++
    const a = samples[j]
    const b = samples[j + 1]
    const k = b.t === a.t ? 0 : (t - a.t) / (b.t - a.t)
    out[i] = a.v + (b.v - a.v) * Math.min(1, Math.max(0, k))
  }
  return out
}

function movingAverage(x, w) {
  const h = Math.floor(w / 2)
  const pre = [0]
  for (const v of x) pre.push(pre[pre.length - 1] + v)
  return x.map((_, i) => {
    const a = Math.max(0, i - h)
    const b = Math.min(x.length, i + h + 1)
    return (pre[b] - pre[a]) / (b - a)
  })
}

function bandpass(x) {
  const slow = movingAverage(x, FS) // about 1 s: removes slow drift
  return movingAverage(x.map((v, i) => v - slow[i]), 5) // about 0.17 s: removes jitter
}

function power(x, f) {
  let re = 0
  let im = 0
  const n = x.length
  for (let i = 0; i < n; i++) {
    const w = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1))
    const ph = (2 * Math.PI * f * i) / FS
    re += x[i] * w * Math.cos(ph)
    im -= x[i] * w * Math.sin(ph)
  }
  return re * re + im * im
}

// Returns null if there is too little data, else { bpm, snr, quality }.
export function estimateBpm(samples) {
  if (!samples || samples.length < 2) return null
  if ((samples[samples.length - 1].t - samples[0].t) / 1000 < MIN_SECONDS) return null
  const x = bandpass(resample(samples)).slice(FS) // drop the first second (filter edge)
  const mean = x.reduce((s, v) => s + v, 0) / x.length
  const y = x.map((v) => v - mean)
  let best = 0
  let bestF = BAND[0]
  let total = 0
  let count = 0
  for (let f = BAND[0]; f <= BAND[1]; f += 0.01) {
    const p = power(y, f)
    total += p
    count++
    if (p > best) {
      best = p
      bestF = f
    }
  }
  const snr = total > 0 ? best / (total / count) : 0
  return { bpm: Math.round(bestF * 60), snr, quality: snr >= 18 ? 'good' : snr >= 12 ? 'fair' : 'low' }
}
