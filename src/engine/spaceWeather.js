// Live space weather from NASA DONKI (Space Weather Database Of Notifications, Knowledge, Information).
// Real data, unlike the simulated cabin / radiation sensors (engine/sensors.js).
//
// Four feeds, last 30 days:
//   FLR            solar flares
//   SEP            solar energetic particle events
//   GST            geomagnetic storms
//   notifications  NASA space weather alerts (CMEs, radiation belt enhancements, shocks, ...)
//   Primary:  https://api.nasa.gov/DONKI/...   (key from VITE_NASA_API_KEY, else DEMO_KEY)
//   Fallback: https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get/...   (no key)
//
// Each feed is independent. The last good result is cached in localStorage, so the app still shows
// something offline. Nothing here throws: loadSpaceWeather() always resolves.
// The crew-facing sentences ("meaning", relevance) are written by this app, not by NASA.

const HOUR = 60 * 60 * 1000
const DAY = 24 * HOUR
const CACHE_KEY = 'orbitcare.spaceWeather.v1'
const API_KEY = import.meta.env.VITE_NASA_API_KEY || 'DEMO_KEY'
const TIMEOUT_MS = 8000 // per request; a slow feed must not hold the others back for long

export const REFRESH_MS = 10 * 60 * 1000 // auto-refresh every 10 minutes
export const WINDOW_DAYS = 30
export const DONKI_PAGE = 'https://kauai.ccmc.gsfc.nasa.gov/DONKI/'

const FEEDS = ['FLR', 'SEP', 'GST', 'notifications']
export const FEED_NAMES = { FLR: 'Solar flares', SEP: 'Solar energetic particles', GST: 'Geomagnetic storms', notifications: 'NASA space weather alerts' }

// Event kinds shown in the app (label for lists and the timeline legend).
export const KINDS = {
  flare: 'Solar flare',
  sep: 'Energetic particles',
  storm: 'Geomagnetic storm',
  cme: 'Coronal mass ejection',
  rbe: 'Radiation belt',
  other: 'Other alert',
}

const ymd = (ms) => new Date(ms).toISOString().slice(0, 10)

async function getJson(url) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const res = await fetch(url, { signal: controller.signal })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const text = await res.text()
    const data = text.trim() ? JSON.parse(text) : [] // DONKI returns an empty body when there are no events
    if (!Array.isArray(data)) throw new Error('Unexpected response') // e.g. a rate-limit message
    return data
  } finally {
    clearTimeout(timer)
  }
}

// One feed: api.nasa.gov first, then the CCMC mirror.
async function fetchFeed(feed, startDate, endDate) {
  const query = `startDate=${startDate}&endDate=${endDate}${feed === 'notifications' ? '&type=all' : ''}`
  try {
    return await getJson(`https://api.nasa.gov/DONKI/${feed}?${query}&api_key=${API_KEY}`)
  } catch {
    return getJson(`https://kauai.ccmc.gsfc.nasa.gov/DONKI/WS/get/${feed}?${query}`)
  }
}

// ---------- Turning DONKI records into crew-readable events ----------

const flareLetter = (e) => (e.flareClass || '').charAt(0).toUpperCase()

function flareMeaning(classType = '') {
  const letter = classType.charAt(0).toUpperCase()
  if (letter === 'X') return 'Major flare. Radiation can rise within minutes outside Earth’s magnetic field. Be ready to shelter.'
  if (letter === 'M') return 'Medium flare. Radio links can drop out briefly. Watch the radiation reading.'
  return 'Minor flare. No action needed for the crew.'
}

function stormMeaning(kp) {
  if (kp != null && kp >= 7) return 'Severe geomagnetic storm. Expect radio and navigation problems.'
  if (kp != null && kp >= 5) return 'Geomagnetic storm. Comms and navigation may be disturbed.'
  return 'Minor disturbance in Earth’s magnetic field.'
}

const SEP_MEANING = 'High-energy particles from the Sun reached near-Earth space. This is the main radiation danger outside Earth’s magnetic field.'

function maxKp(gst) {
  const values = (gst.allKpIndex || []).map((k) => k.kpIndex).filter((n) => typeof n === 'number')
  return values.length ? Math.max(...values) : null
}

function normalizeEvent(feed, raw) {
  if (feed === 'FLR') {
    return {
      id: raw.flrID,
      kind: 'flare',
      source: 'event',
      title: 'Solar flare',
      time: Date.parse(raw.peakTime || raw.beginTime),
      detail: raw.classType ? `Class ${raw.classType}` : 'Class unknown',
      flareClass: raw.classType || '',
      meaning: flareMeaning(raw.classType),
      link: raw.link,
    }
  }
  if (feed === 'SEP') {
    return { id: raw.sepID, kind: 'sep', source: 'event', title: 'Solar energetic particles', time: Date.parse(raw.eventTime), detail: 'Particle event', meaning: SEP_MEANING, link: raw.link }
  }
  const kp = maxKp(raw)
  return {
    id: raw.gstID,
    kind: 'storm',
    source: 'event',
    title: 'Geomagnetic storm',
    time: Date.parse(raw.startTime),
    detail: kp != null ? `Kp ${kp}` : 'Kp unknown',
    kp,
    meaning: stormMeaning(kp),
    link: raw.link,
  }
}

// Notifications: NASA's written alerts. Skips weekly summary reports and the auto-generated
// duplicates (a forecaster-issued version of the same alert follows within minutes).
const NOTICE_KIND = { FLR: 'flare', SEP: 'sep', GST: 'storm', IPS: 'storm', MPC: 'storm', CME: 'cme', RBE: 'rbe' }
const NOTICE_MEANING = {
  cme: 'A cloud of solar material left the Sun. Where it hits, it can bring particles or a storm one to three days later.',
  rbe: 'More high-energy electrons in Earth’s radiation belts. Raises dose in low Earth orbit, especially over the South Atlantic.',
}

function normalizeNotice(raw) {
  const body = raw.messageBody || ''
  if (raw.messageType === 'Report' || /Auto-generated/i.test(body)) return null
  const kind = NOTICE_KIND[raw.messageType] || 'other'
  const subject = (body.match(/Message Type:\s*([^\n#]+)/) || [])[1]?.replace(/^\s*Space Weather Notification\s*-\s*/i, '').trim()
  const flareClass = kind === 'flare' ? (body.match(/\b([XM]\d+(?:\.\d+)?)\b/) || [])[1] || '' : ''
  // CME alerts name what the cloud is predicted to reach, e.g. "CME (STEREO A, Mars, Psyche)".
  const targets = kind === 'cme' ? ((subject || '').match(/\(([^)]*)\)/)?.[1] || '').split(',').map((t) => t.trim()).filter(Boolean) : []
  const kp = kind === 'storm' ? Number((body.match(/Kp\s*(?:index\s*)?(?:of|=|:)?\s*(\d)/i) || [])[1]) || null : null
  const meaning = kind === 'flare' ? flareMeaning(flareClass) : kind === 'sep' ? SEP_MEANING : kind === 'storm' ? stormMeaning(kp) : NOTICE_MEANING[kind] || 'Space weather notice from NASA.'
  return {
    id: raw.messageID,
    kind,
    source: 'alert',
    title: `NASA alert: ${subject || KINDS[kind]}`,
    time: Date.parse(raw.messageIssueTime),
    detail: flareClass ? `Class ${flareClass}` : kp ? `Kp ${kp}` : raw.messageType,
    flareClass,
    kp,
    targets,
    meaning,
    link: raw.messageURL,
  }
}

// Is a CME predicted to reach Earth (and so the ISS and the Moon) or Mars?
const cmeHits = (e, place) => (e.targets || []).some((t) => t.toLowerCase().includes(place))

// ---------- Cache ----------

export function loadCachedSpaceWeather() {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    const data = raw ? JSON.parse(raw) : null
    // Older caches (before notifications) used `type` instead of `kind`: drop them.
    return data && Array.isArray(data.events) && data.events.every((e) => e.kind) ? data : null
  } catch {
    return null
  }
}

function saveCache(data) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data))
  } catch {
    // Storage full or blocked: the live data still shows this session.
  }
}

// ---------- Main entry ----------

// Returns { status: 'live' | 'cached' | 'none', fetchedAt, events, unavailable } (events newest first).
// 'live'   = at least one feed fetched just now from NASA.
// 'cached' = NASA could not be reached at all; last good result (fetchedAt says when).
// 'none'   = never fetched successfully on this device.
// If one feed fails, its events come from the cache (if any) and it is listed in `unavailable`.
export async function loadSpaceWeather(now = Date.now()) {
  const start = ymd(now - WINDOW_DAYS * DAY)
  const end = ymd(now)
  const cached = loadCachedSpaceWeather()
  const results = await Promise.allSettled(FEEDS.map((feed) => fetchFeed(feed, start, end)))

  const unavailable = FEEDS.filter((_, i) => results[i].status === 'rejected')
  if (unavailable.length === FEEDS.length) {
    return cached ? { status: 'cached', ...cached, unavailable: [] } : { status: 'none', fetchedAt: null, events: [], unavailable: [] }
  }

  const fresh = results.flatMap((result, i) => {
    if (result.status !== 'fulfilled') return []
    const feed = FEEDS[i]
    return feed === 'notifications' ? result.value.map(normalizeNotice).filter(Boolean) : result.value.map((raw) => normalizeEvent(feed, raw))
  })
  // For a feed that failed this time, keep what the cache had for it.
  const failedEvent = (e) => (e.source === 'alert' ? unavailable.includes('notifications') : unavailable.some((f) => normalizeKindOfFeed(f) === e.kind))
  const fromCache = (cached?.events ?? []).filter(failedEvent)
  const events = [...fresh, ...fromCache].filter((e) => Number.isFinite(e.time)).sort((a, b) => b.time - a.time)

  const data = { fetchedAt: now, events }
  saveCache(data)
  return { status: 'live', ...data, unavailable }
}

const normalizeKindOfFeed = (feed) => ({ FLR: 'flare', SEP: 'sep', GST: 'storm' })[feed]

// ---------- What it means for the crew ----------

// Big enough to matter: SEP, an M / X flare, a storm of Kp 5+, or a CME aimed at Earth or Mars.
const isNotable = (e) =>
  e.kind === 'sep' || ['M', 'X'].includes(flareLetter(e)) || (e.kind === 'storm' && (e.kp ?? 0) >= 5) || (e.kind === 'cme' && (cmeHits(e, 'earth') || cmeHits(e, 'mars')))
// Shelter-level: an X-class flare or a particle event.
const isMajor = (e) => e.kind === 'sep' || flareLetter(e) === 'X'

// X-class flare or SEP event in the last 24 hours -> the Radiation page shows a shelter warning.
export function recentHazard(events, now = Date.now()) {
  return events.find((e) => e.time <= now && now - e.time < DAY && isMajor(e)) || null
}

// One-line summary for the top of the panel.
// Returns { level: 'active' | 'elevated' | 'quiet', label, text }.
export function spaceWeatherSummary(events, now = Date.now()) {
  const hazard = recentHazard(events, now)
  if (hazard) return { level: 'active', label: 'Active', text: `${hazard.title}${hazard.flareClass ? ` (${hazard.flareClass})` : ''} in the last 24 hours.` }

  const recent = events.find((e) => e.time <= now && now - e.time < 3 * DAY && isNotable(e))
  if (recent) return { level: 'elevated', label: 'Elevated', text: `${KINDS[recent.kind]} in the last 3 days. Watch the radiation reading.` }

  const lastNotable = events.find((e) => e.time <= now && isNotable(e))
  const days = lastNotable ? Math.floor((now - lastNotable.time) / DAY) : WINDOW_DAYS
  return { level: 'quiet', label: 'Quiet', text: lastNotable ? `No major events for ${days} days.` : `No major events in the last ${WINDOW_DAYS} days.` }
}

// Does this event matter where the crew is? envId: 'iss' | 'spacecraft' | 'moon' | 'mars'.
// Returns { level: 'high' | 'some' | 'low', text }.
export function relevanceAt(event, envId) {
  const inLowOrbit = envId === 'iss'
  switch (event.kind) {
    case 'sep':
      return inLowOrbit
        ? { level: 'some', text: 'Partly blocked by Earth’s magnetic field. Extra dose on the parts of the orbit near the poles.' }
        : { level: 'high', text: 'No magnetic field protects you here. This is the biggest radiation risk. Shelter if radiation rises.' }
    case 'flare': {
      const letter = flareLetter(event)
      if (letter === 'X') return { level: 'high', text: inLowOrbit ? 'Radio links to ground may drop out. Watch for particles that can follow.' : 'Particles can follow within hours. Be ready to shelter.' }
      if (letter === 'M') return { level: 'some', text: 'Short radio blackouts are possible. Particles sometimes follow.' }
      return { level: 'low', text: 'Too small to affect the crew.' }
    }
    case 'storm':
      return inLowOrbit && (event.kp ?? 0) >= 5
        ? { level: 'some', text: 'Raises radiation on parts of the orbit and can disturb comms with ground.' }
        : { level: 'low', text: inLowOrbit ? 'Minor. Little effect on the station.' : 'Affects Earth’s magnetic field only. No direct effect here.' }
    case 'rbe':
      return inLowOrbit
        ? { level: 'some', text: 'The station crosses these belts (South Atlantic Anomaly). Expect a slightly higher daily dose.' }
        : { level: 'low', text: 'Earth’s radiation belts only. No effect here.' }
    case 'cme': {
      const toEarth = cmeHits(event, 'earth')
      const toMars = cmeHits(event, 'mars')
      const here = envId === 'mars' ? toMars : envId === 'spacecraft' ? toEarth || toMars : toEarth
      if (here) return { level: 'some', text: `Predicted to reach ${envId === 'mars' ? 'Mars' : envId === 'spacecraft' ? 'your route' : 'Earth'}. Particles or a storm can arrive one to three days later.` }
      const aimedAt = (event.targets || []).join(', ')
      return { level: 'low', text: aimedAt ? `Aimed at ${aimedAt}, not toward you.` : 'Not predicted to reach you.' }
    }
    default:
      return { level: 'low', text: 'For information.' }
  }
}

// Real event big enough for the symptom checker's "solar storm in the last 24 hours" check.
// Reads the cached NASA data (kept fresh by the app every 10 minutes). Returns the event or null.
export function realStormLast24h(now = Date.now()) {
  const events = loadCachedSpaceWeather()?.events ?? []
  return events.find((e) => e.time <= now && now - e.time < DAY && (e.kind === 'sep' || ['M', 'X'].includes(flareLetter(e)) || (e.kind === 'storm' && (e.kp ?? 0) >= 5))) || null
}
