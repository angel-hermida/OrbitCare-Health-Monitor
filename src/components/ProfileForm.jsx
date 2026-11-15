import { useMemo, useState } from 'react'
import { applyOverrides, attentionProfile, bmi, estimateBaseline } from '../engine/personalize.js'
import { formatValue } from '../engine/status.js'
import { BTN_OUTLINE, BTN_PRIMARY, INPUT, INPUT_TEXT, LABEL } from './ui.js'

const splitList = (text) => text.split(',').map((x) => x.trim()).filter(Boolean)

// Baseline fields. In "new" mode empty = use the estimate. In "edit" mode they start filled with the current baseline.
const BASELINE_FIELDS = [
  ['heartRate', 'Resting heart rate (bpm)'],
  ['systolic', 'Systolic BP (mmHg)'],
  ['diastolic', 'Diastolic BP (mmHg)'],
  ['bloodSugar', 'Blood sugar (mg/dL)'],
  ['temperature', 'Temperature (°C)'],
  ['sleep', 'Usual sleep (h)'],
  ['mood', 'Usual mood (1-5)'],
]

const DEFAULT_FORM = {
  name: '', role: 'Mission Specialist', age: '35', gender: 'Female', weightKg: '68', heightCm: '170',
  conditions: '', medications: '', allergies: '', notes: '',
}

function formFrom(a) {
  if (!a) return DEFAULT_FORM
  const m = a.medical || {}
  return {
    name: a.name, role: a.role, age: String(a.age), gender: a.gender,
    weightKg: String(a.weightKg), heightCm: a.heightCm ? String(a.heightCm) : '',
    conditions: (m.conditions || []).join(', '), medications: (m.medications || []).join(', '),
    allergies: (m.allergies || []).join(', '), notes: m.notes || '',
  }
}

function baselineFrom(a) {
  if (!a) return {}
  const b = a.baseline
  return {
    heartRate: String(b.heartRate), systolic: String(b.bloodPressure.systolic), diastolic: String(b.bloodPressure.diastolic),
    bloodSugar: String(b.bloodSugar), temperature: String(b.temperature), sleep: String(b.sleep), mood: String(b.mood),
  }
}

function validate(p) {
  const errors = []
  if (!p.name.trim()) errors.push('Enter a name.')
  if (!(p.age >= 18 && p.age <= 90)) errors.push('Age must be 18-90.')
  if (!(p.weightKg >= 30 && p.weightKg <= 200)) errors.push('Weight must be 30-200 kg.')
  if (!(p.heightCm >= 120 && p.heightCm <= 220)) errors.push('Height must be 120-220 cm.')
  return errors
}

// Create or edit an astronaut. Pass `initial` to edit.
// onSubmit(profile, baselineOverrides) is called with the validated values.
// Display only: `accent` = word of the title shown in red, `intro` = line under it, `centered` = large centered heading.
export default function ProfileForm({ initial, title, accent, intro, centered = false, submitLabel, onSubmit, onCancel }) {
  const editing = Boolean(initial)
  const [f, setF] = useState(() => formFrom(initial))
  const [over, setOver] = useState(() => baselineFrom(initial))
  const set = (key) => (e) => setF((prev) => ({ ...prev, [key]: e.target.value }))

  const profile = useMemo(
    () => ({
      name: f.name.trim(), role: f.role, gender: f.gender,
      age: Number(f.age), weightKg: Number(f.weightKg), heightCm: Number(f.heightCm),
      medical: { conditions: splitList(f.conditions), medications: splitList(f.medications), allergies: splitList(f.allergies), notes: f.notes.trim() },
    }),
    [f]
  )
  const errors = validate({ ...profile, name: f.name })
  const valid = errors.length === 0
  const estimate = valid ? estimateBaseline(profile) : null
  const baseline = valid ? applyOverrides(estimate, over) : null
  const attention = valid ? attentionProfile(profile) : null

  // Labelled input. number = monospace (DM Mono); everything else Inter.
  const field = (label, key, props = {}) => (
    <label className="block">
      <span className={LABEL}>{label}</span>
      <input className={`${props.type === 'number' ? INPUT : INPUT_TEXT} mt-1.5`} value={f[key]} onChange={set(key)} {...props} />
    </label>
  )

  return (
    <div className="space-y-6">
      {/* Heading: one red word, one short line */}
      <div className={centered ? 'text-center' : ''}>
        <h1 className={`font-extrabold tracking-tight text-white ${centered ? 'text-5xl' : 'text-3xl'}`}>
          {renderTitle(title, accent)}
        </h1>
        <p className={`mt-3 text-oc-gray ${centered ? 'mx-auto max-w-xl text-lg' : ''}`}>
          {intro ||
            (editing
              ? 'Update any detail or baseline. Past readings are kept and rated against the new baseline from now on.'
              : 'Baselines and attention level are worked out from this profile.')}
        </p>
      </div>

      <div className="rounded border border-oc-border bg-oc-bg/90 p-6 shadow-2xl shadow-black/40 backdrop-blur-sm sm:p-8">
        <Section title="Identity">
          <div className="grid gap-5 sm:grid-cols-2">
            {field('Name', 'name', { placeholder: 'e.g. Jordan Lee' })}
            {field('Role', 'role', { placeholder: 'e.g. Mission Specialist' })}
          </div>
        </Section>

        <Section title="Body">
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {field('Age', 'age', { type: 'number', min: 18, max: 90 })}
            <label className="block">
              <span className={LABEL}>Gender</span>
              <select className={`${INPUT_TEXT} mt-1.5`} value={f.gender} onChange={set('gender')}>
                <option>Female</option>
                <option>Male</option>
                <option>Other</option>
              </select>
            </label>
            {field('Weight (kg)', 'weightKg', { type: 'number', min: 30, max: 200 })}
            {field('Height (cm)', 'heightCm', { type: 'number', min: 120, max: 220 })}
          </div>
        </Section>

        <Section title="Medical history (optional)" note="Stored only on this device. Separate items with commas.">
          <div className="grid gap-5 sm:grid-cols-3">
            {field('Conditions', 'conditions', { placeholder: 'e.g. asthma' })}
            {field('Medications', 'medications', { placeholder: 'e.g. none' })}
            {field('Allergies', 'allergies', { placeholder: 'e.g. penicillin' })}
          </div>
          <label className="mt-5 block">
            <span className={LABEL}>Notes</span>
            <textarea className={`${INPUT_TEXT} mt-1.5`} rows={2} value={f.notes} onChange={set('notes')} placeholder="Anything the crew medical officer should know" />
          </label>
        </Section>

        {valid && (
          <Section title="Earth baselines" note={editing ? 'Current Earth baseline. Edit any number.' : 'Estimated from the profile. Type a number to replace an estimate.'}>
            <p className="text-sm text-white/90">
              BMI <span className="font-mono">{bmi(profile).toFixed(1)}</span> · Attention level: <span className="font-semibold text-white">{attention.label}</span>
            </p>
            {attention.reasons.length > 0 && (
              <ul className="mt-1 list-disc pl-5 text-sm text-oc-gray">
                {attention.reasons.map((r) => <li key={r}>{r}</li>)}
              </ul>
            )}
            <div className="mt-4 grid gap-4 sm:grid-cols-4">
              {BASELINE_FIELDS.map(([key, label]) => (
                <label key={key} className="block">
                  <span className={`${LABEL} text-[10px] tracking-[0.15em]`}>{label}</span>
                  <input
                    className={`${INPUT} mt-1.5`}
                    type="number"
                    step="any"
                    value={over[key] ?? ''}
                    placeholder={String(key === 'systolic' ? estimate.bloodPressure.systolic : key === 'diastolic' ? estimate.bloodPressure.diastolic : estimate[key])}
                    onChange={(e) => setOver((prev) => ({ ...prev, [key]: e.target.value }))}
                  />
                </label>
              ))}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="text-sm text-oc-gray">
                Blood pressure baseline: <span className="font-mono">{formatValue('bloodPressure', baseline.bloodPressure)}</span>
              </span>
              {editing && (
                <button className={BTN_OUTLINE} onClick={() => setOver({})}>Re-estimate from profile</button>
              )}
            </div>
          </Section>
        )}

        {!valid && f.name !== '' && <p className="mb-4 rounded border border-oc-yellow/70 bg-oc-yellow/10 px-3 py-2 text-sm text-white">{errors.join(' ')}</p>}

        <div className="flex flex-wrap justify-end gap-3 border-t border-oc-border/50 pt-6">
          <button className={BTN_OUTLINE} onClick={onCancel}>Cancel</button>
          <button className={`${BTN_PRIMARY} disabled:cursor-not-allowed disabled:opacity-50`} disabled={!valid} onClick={() => onSubmit(profile, over)}>
            {submitLabel}
          </button>
        </div>
        <p className="mt-3 text-right text-xs text-oc-gray">Estimated baselines are approximate and not medical advice.</p>
      </div>
    </div>
  )
}

// Title with one word in red (accent must appear in the title).
function renderTitle(title, accent) {
  const i = accent ? title.indexOf(accent) : -1
  if (i < 0) return title
  return (
    <>
      {title.slice(0, i)}
      <span className="text-oc-red">{accent}</span>
      {title.slice(i + accent.length)}
    </>
  )
}

// A titled part of the form panel with a thin underline.
function Section({ title, note, children }) {
  return (
    <section className="mb-8">
      <div className="mb-4 border-b border-oc-border/60 pb-2">
        <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-white">{title}</h2>
        {note && <p className="mt-1 text-xs text-oc-gray">{note}</p>}
      </div>
      {children}
    </section>
  )
}
