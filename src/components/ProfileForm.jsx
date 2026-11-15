import { useMemo, useState } from 'react'
import { applyOverrides, attentionProfile, bmi, estimateBaseline } from '../engine/personalize.js'
import { formatValue } from '../engine/status.js'
import { BTN, BTN_PRIMARY, CARD, H1, H2, INPUT, MUTED } from './ui.js'

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
export default function ProfileForm({ initial, title, submitLabel, onSubmit, onCancel }) {
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

  const field = (label, key, props = {}) => (
    <label className="block">
      <span className="text-sm text-slate-300">{label}</span>
      <input className={INPUT} value={f[key]} onChange={set(key)} {...props} />
    </label>
  )

  return (
    <div className="space-y-5">
      <h1 className={H1}>{title}</h1>
      <p className={MUTED}>
        {editing
          ? 'Update any detail or baseline. Past readings are kept and rated against the new baseline from now on.'
          : 'Baselines and attention level are worked out from this profile. You can correct any baseline you already know.'}
      </p>

      <section className={`${CARD} grid gap-4 sm:grid-cols-2`}>
        {field('Name', 'name', { placeholder: 'e.g. Jordan Lee' })}
        {field('Role', 'role')}
        {field('Age', 'age', { type: 'number', min: 18, max: 90 })}
        <label className="block">
          <span className="text-sm text-slate-300">Gender</span>
          <select className={INPUT} value={f.gender} onChange={set('gender')}>
            <option>Female</option>
            <option>Male</option>
            <option>Other</option>
          </select>
        </label>
        {field('Weight (kg)', 'weightKg', { type: 'number', min: 30, max: 200 })}
        {field('Height (cm)', 'heightCm', { type: 'number', min: 120, max: 220 })}
      </section>

      <section className={CARD}>
        <h2 className={H2}>Medical history (optional)</h2>
        <p className="mt-1 text-sm text-slate-400">Separate items with commas. Stored only on this device. The AI assistant will use this later.</p>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          {field('Conditions', 'conditions', { placeholder: 'e.g. asthma' })}
          {field('Medications', 'medications')}
          {field('Allergies', 'allergies')}
        </div>
        <label className="mt-4 block">
          <span className="text-sm text-slate-300">Notes</span>
          <textarea className={INPUT} rows={2} value={f.notes} onChange={set('notes')} />
        </label>
      </section>

      {valid && (
        <section className={CARD}>
          <h2 className={H2}>Health baselines</h2>
          <p className="mt-1 text-slate-300">
            BMI {bmi(profile).toFixed(1)} · Attention level: <span className="font-semibold text-white">{attention.label}</span>
          </p>
          {attention.reasons.length > 0 && (
            <ul className="mt-1 list-disc pl-5 text-sm text-slate-400">
              {attention.reasons.map((r) => <li key={r}>{r}</li>)}
            </ul>
          )}
          <p className="mt-4 text-sm text-slate-400">
            {editing ? 'Current Earth baseline. Edit any number.' : 'Earth baseline: estimated from the profile. Type a number to replace an estimate.'}
          </p>
          <div className="mt-2 grid gap-3 sm:grid-cols-4">
            {BASELINE_FIELDS.map(([key, label]) => (
              <label key={key} className="block">
                <span className="text-xs text-slate-400">{label}</span>
                <input
                  className={INPUT}
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
            <span className="text-sm text-slate-400">Blood pressure baseline: {formatValue('bloodPressure', baseline.bloodPressure)}</span>
            {editing && (
              <button className={BTN} onClick={() => setOver({})}>Re-estimate from profile</button>
            )}
          </div>
        </section>
      )}

      {!valid && f.name !== '' && <p className="text-amber-300">{errors.join(' ')}</p>}

      <div className="flex gap-3">
        <button className={BTN_PRIMARY} disabled={!valid} onClick={() => onSubmit(profile, over)}>{submitLabel}</button>
        <button className={BTN} onClick={onCancel}>Cancel</button>
      </div>
      <p className="text-sm text-slate-400">Prototype. Estimates are placeholders, not medical advice.</p>
    </div>
  )
}
