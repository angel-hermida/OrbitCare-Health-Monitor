import { useMemo, useState } from 'react'
import { BTN, BTN_PRIMARY, CARD, H1, H2, INPUT, MUTED } from '../components/ui.js'
import { attentionProfile, bmi, estimateBaseline, applyOverrides } from '../engine/personalize.js'
import { formatValue } from '../engine/status.js'
import { useMission } from '../store/MissionContext.jsx'

const splitList = (text) => text.split(',').map((x) => x.trim()).filter(Boolean)

// Optional baseline fields. Empty = use the estimate from the profile.
const BASELINE_FIELDS = [
  ['heartRate', 'Resting heart rate (bpm)'],
  ['systolic', 'Systolic BP (mmHg)'],
  ['diastolic', 'Diastolic BP (mmHg)'],
  ['bloodSugar', 'Blood sugar (mg/dL)'],
  ['temperature', 'Temperature (°C)'],
  ['sleep', 'Usual sleep (h)'],
  ['mood', 'Usual mood (1-5)'],
]

function validate(p) {
  const errors = []
  if (!p.name.trim()) errors.push('Enter a name.')
  if (!(p.age >= 18 && p.age <= 90)) errors.push('Age must be 18-90.')
  if (!(p.weightKg >= 30 && p.weightKg <= 200)) errors.push('Weight must be 30-200 kg.')
  if (!(p.heightCm >= 120 && p.heightCm <= 220)) errors.push('Height must be 120-220 cm.')
  return errors
}

// Form to create a custom astronaut. Shown from the crew picker.
export default function NewProfile({ onCancel }) {
  const { addAstronaut } = useMission()
  const [f, setF] = useState({
    name: '', role: 'Mission Specialist', age: '35', gender: 'Female', weightKg: '68', heightCm: '170',
    conditions: '', medications: '', allergies: '', notes: '',
  })
  const [over, setOver] = useState({})
  const set = (key) => (e) => setF((prev) => ({ ...prev, [key]: e.target.value }))

  const profile = useMemo(
    () => ({
      name: f.name, role: f.role, gender: f.gender,
      age: Number(f.age), weightKg: Number(f.weightKg), heightCm: Number(f.heightCm),
      medical: { conditions: splitList(f.conditions), medications: splitList(f.medications), allergies: splitList(f.allergies), notes: f.notes.trim() },
    }),
    [f]
  )
  const errors = validate(profile)
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
    <div className="mx-auto max-w-4xl space-y-5 p-8">
      <h1 className={H1}>New astronaut profile</h1>
      <p className={MUTED}>Baselines and attention level are worked out from this profile. You can correct any baseline you already know.</p>

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
          <h2 className={H2}>Preview</h2>
          <p className="mt-1 text-slate-300">
            BMI {bmi(profile).toFixed(1)} · Attention level: <span className="font-semibold text-white">{attention.label}</span>
          </p>
          {attention.reasons.length > 0 && (
            <ul className="mt-1 list-disc pl-5 text-sm text-slate-400">
              {attention.reasons.map((r) => <li key={r}>{r}</li>)}
            </ul>
          )}
          <p className="mt-4 text-sm text-slate-400">Earth baseline: estimated from the profile. Type a number to replace an estimate.</p>
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
          <p className="mt-3 text-sm text-slate-400">
            Blood pressure baseline: {formatValue('bloodPressure', baseline.bloodPressure)}
          </p>
        </section>
      )}

      {!valid && f.name !== '' && <p className="text-amber-300">{errors.join(' ')}</p>}

      <div className="flex gap-3">
        <button className={BTN_PRIMARY} disabled={!valid} onClick={() => addAstronaut(profile, over)}>Create profile</button>
        <button className={BTN} onClick={onCancel}>Cancel</button>
      </div>
      <p className="text-sm text-slate-400">Prototype. Estimates are placeholders, not medical advice.</p>
    </div>
  )
}
