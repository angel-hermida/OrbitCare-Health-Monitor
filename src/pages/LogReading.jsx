import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import CameraHeartRate from '../components/CameraHeartRate.jsx'
import { StatusPill } from '../components/StatusPill.jsx'
import PageTitle from '../components/PageTitle.jsx'
import { BTN, BTN_DANGER, BTN_PRIMARY, CARD, INPUT, LABEL, STATUS } from '../components/ui.js'
import { INDICATOR_ORDER, THRESHOLDS } from '../data/thresholds.js'
import { formatValue, getStatus } from '../engine/status.js'
import { useMission } from '../store/MissionContext.jsx'
import { usePreferences } from '../store/PreferencesContext.jsx'

const EMPTY_FIELDS = {
  heartRate: '',
  systolic: '',
  diastolic: '',
  bloodSugar: '',
  temperature: '',
  tempUnit: 'C',
  bed: '23:00',
  wake: '06:30',
  mood: 3,
  stress: 3,
  energy: 3,
  loneliness: 3,
}

// Read a number field and check it is a believable value.
function readNumber(text, type, name) {
  const { min, max } = THRESHOLDS[type].input
  const number = Number(text)
  if (text === '' || Number.isNaN(number)) return { error: `Enter a number for ${name}.` }
  if (number < min || number > max) return { error: `${name} should be between ${min} and ${max}. Check the reading and try again.` }
  return { number }
}

const toMinutes = (hhmm) => {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

// Turn the form fields into { value, extra } for addReading, or { error }.
function buildReading(type, f) {
  if (type === 'bloodPressure') {
    const top = readNumber(f.systolic, type, 'the top number')
    if (top.error) return top
    const bottom = readNumber(f.diastolic, type, 'the bottom number')
    if (bottom.error) return bottom
    if (bottom.number >= top.number) return { error: 'The top number should be higher than the bottom number.' }
    return { value: { systolic: top.number, diastolic: bottom.number } }
  }
  if (type === 'temperature') {
    if (f.temperature === '' || Number.isNaN(Number(f.temperature))) return { error: 'Enter a number for temperature.' }
    const celsius = f.tempUnit === 'F' ? ((Number(f.temperature) - 32) * 5) / 9 : Number(f.temperature)
    const rounded = Math.round(celsius * 10) / 10
    return readNumber(String(rounded), type, 'Temperature').error ? readNumber(String(rounded), type, 'Temperature') : { value: rounded }
  }
  if (type === 'sleep') {
    if (!f.bed || !f.wake) return { error: 'Enter both times.' }
    const minutes = (toMinutes(f.wake) - toMinutes(f.bed) + 24 * 60) % (24 * 60)
    if (minutes === 0) return { error: 'Bedtime and wake time are the same.' }
    return { value: Math.round((minutes / 60) * 10) / 10, extra: { bed: f.bed, wake: f.wake } }
  }
  if (type === 'mood') {
    return { value: Number(f.mood), extra: { stress: Number(f.stress), energy: Number(f.energy), loneliness: Number(f.loneliness) } }
  }
  const result = readNumber(f[type], type, THRESHOLDS[type].label)
  return result.error ? result : { value: result.number }
}

function Slider({ label, low, high, value, onChange }) {
  return (
    <label className="block">
      <span className="flex justify-between text-white">
        <span>{label}</span>
        <span className="font-mono font-medium text-white">{value} / 5</span>
      </span>
      <input type="range" min="1" max="5" step="1" value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 w-full" />
      <span className="flex justify-between text-xs text-slate-400">
        <span>1 · {low}</span>
        <span>5 · {high}</span>
      </span>
    </label>
  )
}

export default function LogReading() {
  const { astronaut, missionState, addReading } = useMission()
  const { tempUnit } = usePreferences() // red readings sound through the Master Alarm (components/MasterAlarm.jsx)
  const [params] = useSearchParams()
  const [type, setType] = useState(INDICATOR_ORDER.includes(params.get('type')) ? params.get('type') : 'heartRate')
  // The temperature field starts in the unit chosen in Settings.
  const emptyFields = { ...EMPTY_FIELDS, tempUnit }
  const [fields, setFields] = useState(emptyFields)
  const [error, setError] = useState('')
  const [saved, setSaved] = useState(null) // { type, value, status }
  const [cameraBpm, setCameraBpm] = useState(null) // last camera estimate placed in the field

  const set = (name) => (eventOrValue) => {
    const value = eventOrValue?.target ? eventOrValue.target.value : eventOrValue
    setFields((prev) => ({ ...prev, [name]: value }))
  }

  function chooseType(next) {
    setType(next)
    setError('')
    setSaved(null)
  }

  function submit(event) {
    event.preventDefault()
    const built = buildReading(type, fields)
    if (built.error) {
      setError(built.error)
      setSaved(null)
      return
    }
    // Every reading goes through addReading (see store/storage.js).
    // A camera estimate saved unchanged is stored as source 'device'.
    const source = type === 'heartRate' && cameraBpm !== null && built.value === cameraBpm ? 'device' : 'manual'
    addReading({ astronautId: astronaut.id, type, value: built.value, source, extra: built.extra })
    const status = getStatus(type, built.value, astronaut, missionState)
    setSaved({ type, value: built.value, status })
    setError('')
    setFields(emptyFields)
    setCameraBpm(null)
  }

  const def = THRESHOLDS[type]

  return (
    <div className="max-w-3xl space-y-5">
      <PageTitle title="Log a Reading" accent="Reading" />

      {/* Pick the indicator */}
      <div className="flex flex-wrap gap-2">
        {INDICATOR_ORDER.map((key) => (
          <button
            key={key}
            onClick={() => chooseType(key)}
            className={`cursor-pointer rounded border px-4 py-2 text-sm font-semibold uppercase tracking-wider ${key === type ? 'border-oc-blue bg-oc-panel text-white' : 'border-oc-border/60 text-oc-gray hover:bg-oc-panel/40 hover:text-white'}`}
          >
            {THRESHOLDS[key].label}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className={`${CARD} space-y-5`}>
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-bold uppercase tracking-wider text-white">{def.label}</h2>
          <Link to={`/guides#${type}`} className="text-sm font-semibold text-oc-blue hover:underline">How do I measure this?</Link>
        </div>

        {type === 'heartRate' && (
          <label className="block">
            <span className={LABEL}>Beats per minute (bpm)</span>
            <input className={`${INPUT} mt-1`} inputMode="numeric" placeholder="e.g. 62" value={fields.heartRate} onChange={set('heartRate')} autoFocus />
          </label>
        )}

        {type === 'heartRate' && (
          <CameraHeartRate
            onUse={(bpm) => {
              setFields((prev) => ({ ...prev, heartRate: String(bpm) }))
              setCameraBpm(bpm)
              setError('')
            }}
          />
        )}

        {type === 'bloodPressure' && (
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className={LABEL}>Top number (systolic)</span>
              <input className={`${INPUT} mt-1`} inputMode="numeric" placeholder="e.g. 118" value={fields.systolic} onChange={set('systolic')} autoFocus />
            </label>
            <label className="block">
              <span className={LABEL}>Bottom number (diastolic)</span>
              <input className={`${INPUT} mt-1`} inputMode="numeric" placeholder="e.g. 76" value={fields.diastolic} onChange={set('diastolic')} />
            </label>
          </div>
        )}

        {type === 'bloodSugar' && (
          <label className="block">
            <span className={LABEL}>Blood sugar (mg/dL)</span>
            <input className={`${INPUT} mt-1`} inputMode="numeric" placeholder="e.g. 90" value={fields.bloodSugar} onChange={set('bloodSugar')} autoFocus />
          </label>
        )}

        {type === 'temperature' && (
          <div className="grid grid-cols-[1fr_auto] gap-4">
            <label className="block">
              <span className={LABEL}>Temperature</span>
              <input className={`${INPUT} mt-1`} inputMode="decimal" placeholder={fields.tempUnit === 'C' ? 'e.g. 36.8' : 'e.g. 98.2'} value={fields.temperature} onChange={set('temperature')} autoFocus />
            </label>
            <label className="block">
              <span className={LABEL}>Unit</span>
              <select className={`${INPUT} mt-1`} value={fields.tempUnit} onChange={set('tempUnit')}>
                <option value="C">°C</option>
                <option value="F">°F</option>
              </select>
            </label>
          </div>
        )}

        {type === 'sleep' && (
          <div className="grid grid-cols-2 gap-4">
            <label className="block">
              <span className={LABEL}>Went to sleep at</span>
              <input type="time" className={`${INPUT} mt-1`} value={fields.bed} onChange={set('bed')} />
            </label>
            <label className="block">
              <span className={LABEL}>Woke up at</span>
              <input type="time" className={`${INPUT} mt-1`} value={fields.wake} onChange={set('wake')} />
            </label>
          </div>
        )}

        {type === 'mood' && (
          <div className="space-y-5">
            <Slider label="Overall, how is your mood right now?" low="very low" high="very good" value={fields.mood} onChange={set('mood')} />
            <Slider label="How stressed do you feel?" low="calm" high="very stressed" value={fields.stress} onChange={set('stress')} />
            <Slider label="How much energy do you have?" low="none" high="plenty" value={fields.energy} onChange={set('energy')} />
            <Slider label="How lonely do you feel?" low="not at all" high="very lonely" value={fields.loneliness} onChange={set('loneliness')} />
          </div>
        )}

        {error && <p className="rounded border border-oc-alert/70 bg-oc-alert/10 px-3 py-2 text-white">{error}</p>}

        <button type="submit" className={`${BTN_PRIMARY} px-8 py-3 text-base`}>Save reading</button>
      </form>

      {/* Result of the reading that was just saved */}
      {saved && (
        <section className={`rounded border p-5 ${STATUS[saved.status.level].border} ${STATUS[saved.status.level].bg}`}>
          <div className="flex items-center gap-3">
            <StatusPill level={saved.status.level} />
            <span className={LABEL}>{THRESHOLDS[saved.type].label} saved</span>
          </div>
          <p className={`mt-3 font-mono text-4xl font-medium ${STATUS[saved.status.level].text}`}>{formatValue(saved.type, saved.value, tempUnit)}</p>
          <p className="mt-3 text-lg text-white">{saved.status.message}</p>
          <p className="mt-2 border-t border-white/20 pt-2 text-white/90">
            <span className="font-semibold text-white">Next step: </span>
            {saved.status.action}
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            {saved.status.level === 'red' && <Link to="/emergency" className={BTN_DANGER}>Open Emergency mode</Link>}
            {saved.status.level !== 'green' && <Link to="/symptoms" className={BTN}>Check a symptom</Link>}
            <Link to="/" className={BTN}>Back to dashboard</Link>
          </div>
        </section>
      )}
    </div>
  )
}
