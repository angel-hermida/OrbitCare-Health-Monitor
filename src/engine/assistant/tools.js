// Tools the AI assistant can call. No React. All data stays on this device; only the result of a
// tool the model asks for is sent to the Claude API.
//
// SAFETY RULE: no tool takes an astronaut id. Every tool is bound (in createTools) to the astronaut
// who is signed in, so the model cannot ask for another crew member's data, even if told to.
//
// Each executor returns { result, card }:
//   result -> JSON sent back to the model
//   card   -> structured data the chat panel renders itself (the numbers on screen come straight
//             from the app's data, never from the model's text)

import { CHECK_INTERVAL_HOURS } from '../../data/checkin.js'
import { INDICATOR_ORDER, THRESHOLDS } from '../../data/thresholds.js'
import { getFreshness } from '../checkin.js'
import { formatValue, getIndicatorRanges, getStatus } from '../status.js'
import { getReadings, getRecords, latestReading } from '../../store/storage.js'
import { DAY, linearTrend, mean } from './trend.js'

// Indicators people ask about that OrbitCare does not measure. The model must say so, not guess.
export const NOT_TRACKED = ['blood oxygen (SpO2)', 'respiratory rate', 'ECG / heart rhythm', 'body weight trend', 'bone density']

// Pages the assistant may open. Only routes that exist in App.jsx.
export const NAV_PAGES = {
  dashboard: { route: '/', label: 'Dashboard', about: 'Today\'s status for all 6 indicators and the daily check-in.' },
  log: { route: '/log', label: 'Log a reading', about: 'Enter a new measurement by hand.' },
  log_sleep: { route: '/log?type=sleep', label: 'Log sleep', about: 'Log form with sleep preselected.' },
  log_heart_rate: { route: '/log?type=heartRate', label: 'Log heart rate', about: 'Log form with heart rate preselected.' },
  trends: { route: '/history', label: 'Trends', about: '30-day charts for every indicator, incl. heart rate, with colored range bands.' },
  symptoms: { route: '/symptoms', label: 'Symptom checker', about: 'Step-by-step questions for a symptom.' },
  guides: { route: '/guides', label: 'How to measure', about: 'How to take each measurement in space.' },
  records: { route: '/records', label: 'Medical records', about: 'Upload a medical record (PDF or image) and see what was extracted.' },
  profile: { route: '/profile', label: 'My profile', about: 'Astronaut profile, Earth baselines, conditions, medications, allergies.' },
  radiation: { route: '/radiation', label: 'Radiation', about: 'Live NASA space weather and radiation readings.' },
  isolation: { route: '/isolation', label: 'Isolation', about: 'Mood, isolation and messages from home.' },
  distance: { route: '/distance', label: 'Distance', about: 'Delay to Earth and response levels.' },
  gravity: { route: '/gravity', label: 'Gravity', about: 'Gravity effects on the body.' },
  environment: { route: '/environment', label: 'Environment', about: 'Cabin sensors (simulated).' },
  mission: { route: '/mission', label: 'Mission setup', about: 'Change location (ISS, transit, Moon, Mars).' },
  settings: { route: '/settings', label: 'Settings', about: 'Theme, units, alarm sound.' },
  emergency: { route: '/emergency', label: 'Emergency mode', about: 'Emergency scenarios and the report to ground.' },
}

const iso = (t) => new Date(t).toISOString()
const round = (n, d = 1) => (n == null ? null : Math.round(n * 10 ** d) / 10 ** d)

// Scalar series for an indicator. Blood pressure splits into its two numbers.
function series(readings, type) {
  if (type !== 'bloodPressure') return { [type]: readings.map((r) => ({ t: r.timestamp, y: r.value })) }
  return {
    systolic: readings.map((r) => ({ t: r.timestamp, y: r.value.systolic })),
    diastolic: readings.map((r) => ({ t: r.timestamp, y: r.value.diastolic })),
  }
}

const INDICATOR_ENUM = [...INDICATOR_ORDER]

export const TOOL_DEFINITIONS = [
  {
    name: 'get_current_vitals',
    description:
      'Latest measured value of every OrbitCare indicator for the signed-in astronaut (heart rate, blood pressure, blood sugar, body temperature, sleep, mood), with unit, timestamp, age, whether the daily check is due, and the app status (OK / CAUTION / ALERT). Also lists measurements the app does not track.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'get_history',
    description:
      'Measured readings of one indicator over a past window, with timestamps, plus min / max / average and a comparison of the latest reading with the previous one and with the window average. Use for "how has X changed", "compare with previous readings", "last night\'s sleep".',
    input_schema: {
      type: 'object',
      properties: {
        indicator: { type: 'string', enum: INDICATOR_ENUM },
        hours: { type: 'number', description: 'Window length in hours (1 to 720). Default 168 (7 days).' },
      },
      required: ['indicator'],
    },
  },
  {
    name: 'check_ranges',
    description:
      'Compares each latest reading with the configured reference ranges at the current response level and with the astronaut\'s Earth baseline. Use for "is anything out of range".',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'analyze_trend',
    description:
      'Statistical trend and short forecast for one indicator: least-squares line over the window, slope per day with 95% interval, direction (rising / falling / no clear trend), and an ESTIMATED value at the horizon with a 95% prediction interval. Refuses when there are fewer than 5 readings. Use for projections, "is X increasing", concerning trends.',
    input_schema: {
      type: 'object',
      properties: {
        indicator: { type: 'string', enum: INDICATOR_ENUM },
        window_days: { type: 'number', description: 'Days of history to fit (5 to 30). Default 14.' },
        horizon_days: { type: 'number', description: 'Days ahead to estimate (0 to 7). Capped at half the window. Default 3.' },
      },
      required: ['indicator'],
    },
  },
  {
    name: 'get_medical_records',
    description:
      'Medical information documented for the signed-in astronaut: entries in the OrbitCare profile and data extracted from uploaded medical records (conditions, medications and doses, allergies, lab / blood test results, exam dates, history). Each item names its source document. Empty lists mean nothing is documented, NOT that the astronaut has none.',
    input_schema: {
      type: 'object',
      properties: {
        category: { type: 'string', enum: ['all', 'conditions', 'medications', 'allergies', 'labs', 'exams', 'history'], description: 'Default all.' },
      },
      required: [],
    },
  },
  {
    name: 'get_mission_context',
    description: 'Location, mission day, delay to Earth, response level, recent symptom-checker results and recent mission events for the signed-in astronaut.',
    input_schema: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'navigate',
    description: 'Open a page of the OrbitCare app for the astronaut. Use whenever the astronaut asks to see, open, go to or find a page or feature.',
    input_schema: {
      type: 'object',
      properties: { page: { type: 'string', enum: Object.keys(NAV_PAGES) } },
      required: ['page'],
    },
  },
]

// ctx: { db, astronaut, missionState, tempUnit, navigate(route), now }
// Returns { run(name, input) -> { result, card } }.
export function createTools(getCtx) {
  const handlers = {
    get_current_vitals() {
      const { db, astronaut, missionState, tempUnit, now } = getCtx()
      const vitals = INDICATOR_ORDER.map((type) => {
        const def = THRESHOLDS[type]
        const r = latestReading(db, astronaut.id, type)
        if (!r) return { indicator: type, label: def.label, measured: false, note: 'No reading recorded.' }
        const fresh = getFreshness(r, type, now)
        const s = getStatus(type, r.value, astronaut, missionState)
        return {
          indicator: type,
          label: def.label,
          measured: true,
          value: r.value,
          display: formatValue(type, r.value, tempUnit),
          unit: def.unit,
          timestamp: iso(r.timestamp),
          hoursOld: round(fresh.hoursOld),
          checkDue: fresh.due,
          checkIntervalHours: CHECK_INTERVAL_HOURS[type] ?? 24,
          source: r.source,
          status: fresh.due ? 'DUE (reading older than the check interval, status not current)' : { green: 'OK', yellow: 'CAUTION', red: 'ALERT' }[s.level],
          appMessage: s.message,
          appAction: s.action,
          earthBaseline: formatValue(type, astronaut.baseline?.[type], tempUnit),
        }
      })
      return {
        result: { astronaut: astronaut.name, retrievedAt: iso(now), vitals, notTrackedByOrbitCare: NOT_TRACKED },
        card: { kind: 'vitals', items: vitals },
      }
    },

    get_history({ indicator, hours = 168 }) {
      const { db, astronaut, tempUnit, now } = getCtx()
      if (!THRESHOLDS[indicator]) return { result: { error: `Unknown indicator ${indicator}` } }
      const h = Math.min(720, Math.max(1, Number(hours) || 168))
      const all = getReadings(db, astronaut.id, indicator)
      const inWindow = all.filter((r) => r.timestamp >= now - h * 3600 * 1000)
      const fmt = (r) => ({ timestamp: iso(r.timestamp), value: r.value, display: formatValue(indicator, r.value, tempUnit) })
      const out = {
        indicator,
        label: THRESHOLDS[indicator].label,
        unit: THRESHOLDS[indicator].unit,
        windowHours: h,
        readingsInWindow: inWindow.length,
        totalReadingsStored: all.length,
        readings: inWindow.slice(-40).map(fmt),
      }
      if (all.length === 0) out.note = 'No readings recorded for this indicator.'
      else if (inWindow.length === 0) out.note = `No readings in the last ${h} h. Most recent reading: ${fmt(all[all.length - 1]).display} at ${iso(all[all.length - 1].timestamp)}.`
      if (inWindow.length) {
        const stats = {}
        for (const [key, pts] of Object.entries(series(inWindow, indicator))) {
          const ys = pts.map((p) => p.y)
          stats[key] = { min: Math.min(...ys), max: Math.max(...ys), average: round(mean(ys)) }
        }
        out.summary = stats
      }
      if (all.length >= 2) {
        const latest = all[all.length - 1]
        const prev = all[all.length - 2]
        out.latestVsPrevious = { latest: fmt(latest), previous: fmt(prev) }
      }
      return {
        result: out,
        card: { kind: 'history', indicator, label: out.label, windowHours: h, readings: inWindow.map((r) => ({ t: r.timestamp, display: formatValue(indicator, r.value, tempUnit) })), summary: out.summary, unit: out.unit },
      }
    },

    check_ranges() {
      const { db, astronaut, missionState, tempUnit, now } = getCtx()
      const levelIndex = missionState?.responseLevel?.index ?? 0
      const items = INDICATOR_ORDER.map((type) => {
        const def = THRESHOLDS[type]
        const r = latestReading(db, astronaut.id, type)
        const ranges = getIndicatorRanges(type, levelIndex)
        if (!r) return { indicator: type, label: def.label, measured: false, ranges }
        const s = getStatus(type, r.value, astronaut, missionState)
        const fresh = getFreshness(r, type, now)
        return {
          indicator: type,
          label: def.label,
          measured: true,
          display: formatValue(type, r.value, tempUnit),
          timestamp: iso(r.timestamp),
          checkDue: fresh.due,
          normalRange: ranges.green ?? ranges,
          cautionRange: ranges.yellow,
          earthBaseline: formatValue(type, astronaut.baseline?.[type], tempUnit),
          status: { green: 'OK', yellow: 'CAUTION', red: 'ALERT' }[s.level],
          appMessage: s.message,
          appAction: s.action,
        }
      })
      return {
        result: {
          responseLevel: missionState?.responseLevel?.label,
          note: 'Ranges in thresholds.js are general adult reference ranges configured in OrbitCare, tightened as the response level rises. Temperatures in ranges are in °C.',
          items,
        },
        card: { kind: 'ranges', items },
      }
    },

    analyze_trend({ indicator, window_days = 14, horizon_days = 3 }) {
      const { db, astronaut, now, tempUnit } = getCtx()
      if (!THRESHOLDS[indicator]) return { result: { error: `Unknown indicator ${indicator}` } }
      const w = Math.min(30, Math.max(5, Number(window_days) || 14))
      const hz = Math.min(7, Math.max(0, Number.isFinite(Number(horizon_days)) ? Number(horizon_days) : 3))
      const readings = getReadings(db, astronaut.id, indicator).filter((r) => r.timestamp >= now - w * DAY)
      const parts = {}
      for (const [key, pts] of Object.entries(series(readings, indicator))) {
        parts[key] = linearTrend(pts, { horizonDays: hz, now })
      }
      const latest = readings[readings.length - 1]
      const result = {
        indicator,
        label: THRESHOLDS[indicator].label,
        unit: THRESHOLDS[indicator].unit + (indicator === 'temperature' ? ' (analysis in °C)' : ''),
        windowDays: w,
        measuredLatest: latest ? { timestamp: iso(latest.timestamp), display: formatValue(indicator, latest.value, tempUnit) } : null,
        trend: parts,
        caution: 'Forecast values are ESTIMATED from a straight-line fit, not measurements. Not a diagnosis.',
      }
      return { result, card: { kind: 'trend', indicator, label: result.label, unit: THRESHOLDS[indicator].unit, windowDays: w, parts, measuredLatest: result.measuredLatest } }
    },

    get_medical_records({ category = 'all' } = {}) {
      const { db, astronaut } = getCtx()
      const m = astronaut.medical || {}
      const profile = {
        source: 'OrbitCare profile (entered by hand)',
        conditions: m.conditions ?? [],
        medications: m.medications ?? [],
        allergies: m.allergies ?? [],
        notes: m.notes || null,
      }
      const records = getRecords(db, astronaut.id).map((r) => ({
        source: `Uploaded record "${r.fileName}"`,
        uploadedAt: iso(r.uploadedAt),
        documentDate: r.extracted?.documentDate ?? null,
        documentType: r.extracted?.documentType ?? null,
        ...pick(r.extracted || {}, category),
      }))
      return {
        result: {
          category,
          profile: category === 'all' || ['conditions', 'medications', 'allergies'].includes(category) ? profile : undefined,
          uploadedRecords: records,
          uploadedRecordCount: records.length,
          reminder: 'An empty list only means nothing is documented here. Do not conclude the astronaut has no condition, medication or allergy.',
        },
        card: { kind: 'records', count: records.length, category },
      }
    },

    get_mission_context() {
      const { db, astronaut, missionState, now } = getCtx()
      const symptoms = (db.symptoms ?? []).filter((s) => s.astronautId === astronaut.id).slice(-5)
      const events = (db.events ?? []).filter((e) => e.timestamp >= now - 30 * DAY)
      return {
        result: {
          location: missionState?.environment?.name,
          missionDay: db.settings?.missionDay,
          delayToEarthSeconds: missionState?.comms?.seconds ?? null,
          blackout: missionState?.comms?.blackout ?? false,
          responseLevel: missionState?.responseLevel?.label,
          redInstruction: missionState?.responseLevel?.redInstruction,
          recentSymptomChecks: symptoms.map((s) => ({ title: s.title || s.symptom, result: s.level, timestamp: iso(s.timestamp) })),
          recentEvents: events.map((e) => ({ type: e.type, timestamp: iso(e.timestamp), label: 'SIMULATED (demo event)' })),
        },
      }
    },

    navigate({ page }) {
      const { navigate } = getCtx()
      const target = NAV_PAGES[page]
      if (!target) return { result: { ok: false, error: `Unknown page ${page}` } }
      navigate(target.route)
      return { result: { ok: true, opened: target.label, route: target.route }, card: { kind: 'nav', label: target.label } }
    },
  }

  return {
    run(name, input) {
      const h = handlers[name]
      if (!h) return { result: { error: `Unknown tool ${name}` } }
      try {
        return h(input || {})
      } catch (e) {
        return { result: { error: `Tool failed: ${e.message}` } }
      }
    },
  }
}

function pick(extracted, category) {
  const keys = ['conditions', 'medications', 'allergies', 'labs', 'exams', 'history', 'notes']
  const out = {}
  for (const k of keys) if (category === 'all' || category === k) out[k] = extracted[k] ?? []
  return out
}
