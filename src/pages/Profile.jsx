import { useState } from 'react'
import PageTitle from '../components/PageTitle.jsx'
import ProfileForm from '../components/ProfileForm.jsx'
import { StatusPill } from '../components/StatusPill.jsx'
import { BTN, BTN_DANGER, BTN_OUTLINE, CARD, H2, LABEL, TABLE, TD, TH } from '../components/ui.js'
import { INDICATOR_ORDER, THRESHOLDS } from '../data/thresholds.js'
import { attentionProfile, bmi } from '../engine/personalize.js'
import { formatValue, getStatus } from '../engine/status.js'
import { getStreaks } from '../engine/streaks.js'
import { timeAgo } from '../engine/time.js'
import { useMission } from '../store/MissionContext.jsx'
import { usePreferences } from '../store/PreferencesContext.jsx'
import { getReadings, latestReading } from '../store/storage.js'

// Who the astronaut is, their attention level and medical history, and their Earth baseline
// next to their latest reading. The profile can be edited or removed from the crew.
export default function Profile() {
  const { db, astronaut, missionState, selectAstronaut, updateAstronaut, removeAstronaut } = useMission()
  const { tempUnit } = usePreferences()
  const [mode, setMode] = useState('view') // 'view' | 'edit' | 'confirmRemove'
  const attention = attentionProfile(astronaut)
  const body = bmi(astronaut)
  const medical = astronaut.medical || {}
  const readingCount = getReadings(db, astronaut.id).length
  const streak = getStreaks(db, astronaut.id)
  const listText = (arr) => (arr?.length ? arr.join(', ') : 'None recorded')

  if (mode === 'edit') {
    return (
      <div className="max-w-4xl">
        <ProfileForm
          initial={astronaut}
          title={`Edit ${astronaut.name}`}
          submitLabel="Save changes"
          onSubmit={(profile, overrides) => {
            updateAstronaut(astronaut.id, profile, overrides)
            setMode('view')
          }}
          onCancel={() => setMode('view')}
        />
      </div>
    )
  }

  return (
    <div className="max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className={`${LABEL} mb-1`}>Crew member</p>
          <h1 className="text-3xl font-bold text-white">{astronaut.name}</h1>
          <p className="mt-1 text-oc-blue">{astronaut.role}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className={BTN} onClick={() => setMode('edit')}>Edit profile</button>
          <button className={BTN_OUTLINE} onClick={() => selectAstronaut(null)}>Switch crew member</button>
          <button className={BTN_OUTLINE} onClick={() => setMode('confirmRemove')}>Remove from crew</button>
        </div>
      </div>

      {mode === 'confirmRemove' && (
        <section className={`${CARD} border-oc-alert/70`}>
          <h2 className={H2}>Remove {astronaut.name} from the crew?</h2>
          <p className="mt-1 text-oc-gray">
            This deletes the profile, {readingCount} saved reading{readingCount === 1 ? '' : 's'} and symptom logs on this device. It cannot be undone.
          </p>
          <div className="mt-3 flex gap-3">
            <button className={BTN_DANGER} onClick={() => removeAstronaut(astronaut.id)}>Yes, remove</button>
            <button className={BTN_OUTLINE} onClick={() => setMode('view')}>Keep</button>
          </div>
        </section>
      )}

      <section className={`${CARD} grid grid-cols-2 gap-4 sm:grid-cols-5`}>
        {[
          ['Age', astronaut.age],
          ['Gender', astronaut.gender],
          ['Weight', `${astronaut.weightKg} kg`],
          ['Height', astronaut.heightCm ? `${astronaut.heightCm} cm` : '—'],
          ['BMI', body ? body.toFixed(1) : '—'],
        ].map(([label, value]) => (
          <div key={label}>
            <p className={LABEL}>{label}</p>
            <p className="mt-1 font-mono text-2xl text-white">{value}</p>
          </div>
        ))}
      </section>

      {/* Daily check-in streak (information only) */}
      <section className={`${CARD} grid grid-cols-2 gap-4 sm:grid-cols-5`}>
        <div>
          <p className={LABEL}>Current streak</p>
          <p className="mt-1 font-mono text-2xl text-white">{streak.current} {streak.current === 1 ? 'day' : 'days'}</p>
        </div>
        <div>
          <p className={LABEL}>Best streak</p>
          <p className="mt-1 font-mono text-2xl text-white">{streak.best} {streak.best === 1 ? 'day' : 'days'}</p>
        </div>
        <p className="col-span-2 self-center text-sm text-oc-gray sm:col-span-3">
          {streak.todayComplete ? 'Today’s check-in is complete.' : 'Complete today’s check-in to keep the streak.'} A day counts when all six indicators are logged.
        </p>
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <section className={CARD}>
          <p className={LABEL}>Attention level</p>
          <p className="mt-1 text-xl font-bold text-white">{attention.label}</p>
          <p className="mt-2 text-sm text-oc-gray">
            {attention.reasons.length ? attention.reasons.join(' ') : 'No extra risk factors. Standard limits apply.'}
          </p>
        </section>

        <section className={CARD}>
          <p className={LABEL}>Medical history</p>
          <dl className="mt-2 space-y-1 text-white/90">
            <div><dt className="inline font-semibold text-white">Conditions: </dt><dd className="inline">{listText(medical.conditions)}</dd></div>
            <div><dt className="inline font-semibold text-white">Medications: </dt><dd className="inline">{listText(medical.medications)}</dd></div>
            <div><dt className="inline font-semibold text-white">Allergies: </dt><dd className="inline">{listText(medical.allergies)}</dd></div>
            {medical.notes && <div><dt className="inline font-semibold text-white">Notes: </dt><dd className="inline">{medical.notes}</dd></div>}
          </dl>
        </section>
      </div>

      <section className="space-y-3">
        <PageTitle title="Earth Baseline vs Now" accent="Baseline" as="h2" size="text-2xl" />
        <p className="text-sm text-oc-gray">
          Baseline source: {astronaut.baselineSource || 'measured before the mission'}
          {astronaut.baselineUpdatedAt ? `, updated ${timeAgo(astronaut.baselineUpdatedAt)}` : ''}. The app flags readings that move too far from it, even when they are inside the general safe range.
        </p>
        <table className={TABLE}>
          <thead>
            <tr>
              <th className={TH}>Indicator</th>
              <th className={TH}>Earth baseline</th>
              <th className={TH}>Latest</th>
              <th className={TH}>Status</th>
            </tr>
          </thead>
          <tbody>
            {INDICATOR_ORDER.map((type) => {
              const reading = latestReading(db, astronaut.id, type)
              const status = reading ? getStatus(type, reading.value, astronaut, missionState) : null
              return (
                <tr key={type}>
                  <td className={TD}>{THRESHOLDS[type].label}</td>
                  <td className={`${TD} font-mono text-oc-gray`}>{formatValue(type, astronaut.baseline[type], tempUnit)}</td>
                  <td className={TD}>
                    <span className="font-mono">{reading ? formatValue(type, reading.value, tempUnit) : '—'}</span>
                    {reading && <span className="block text-xs text-oc-gray">{timeAgo(reading.timestamp)}</span>}
                  </td>
                  <td className={TD}><StatusPill level={status ? status.level : 'none'} /></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </section>
    </div>
  )
}
