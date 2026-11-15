// Medical records: upload a PDF or image, the AI assistant reads it into structured data,
// and the result is saved for the signed-in astronaut only. The assistant can use it at once.

import { useRef, useState } from 'react'
import PageTitle from '../components/PageTitle.jsx'
import { BTN, BTN_OUTLINE, BTN_PRIMARY, CARD, H2, LABEL } from '../components/ui.js'
import { assistantConfigured, extractMedicalRecord, MAX_RECORD_BYTES, SUPPORTED_RECORD_TYPES } from '../engine/assistant/claude.js'
import { formatDateTime } from '../engine/time.js'
import { useMission } from '../store/MissionContext.jsx'
import { getRecords } from '../store/storage.js'

const norm = (s) => String(s || '').toLowerCase().replace(/[^a-z]/g, ' ').split(/\s+/).filter(Boolean)
// The record names someone else when none of the astronaut's name parts appear in it.
const nameMismatch = (recordName, astronautName) => recordName && !norm(recordName).some((p) => norm(astronautName).includes(p))

function Section({ title, items, render }) {
  return (
    <div>
      <p className={`${LABEL} mb-1`}>{title}</p>
      {items?.length ? <ul className="space-y-1 text-sm text-white">{items.map((it, i) => <li key={i}>{render(it)}</li>)}</ul> : <p className="text-sm text-oc-gray">None documented in this record.</p>}
    </div>
  )
}

const Evidence = ({ text }) => (text ? <span className="block text-xs text-oc-gray">Record states: “{text}”</span> : null)

function RecordView({ record, onRemove }) {
  const x = record.extracted || {}
  return (
    <section className={`${CARD} space-y-4`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className={H2}>{x.documentType || 'Medical record'}</h2>
          <p className="text-sm text-oc-gray">
            {record.fileName} · document date {x.documentDate || 'not stated'} · uploaded {formatDateTime(record.uploadedAt)}
          </p>
        </div>
        <button className={`${BTN_OUTLINE} px-3 py-1.5 text-xs`} onClick={onRemove}>Remove</button>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <Section title="Conditions" items={x.conditions} render={(c) => <>{c.name}{c.status ? ` (${c.status})` : ''}<Evidence text={c.evidence} /></>} />
        <Section title="Medications" items={x.medications} render={(m) => <>{m.name}{m.dose ? ` · ${m.dose}` : ''}{m.frequency ? ` · ${m.frequency}` : ''}{m.status ? ` (${m.status})` : ''}<Evidence text={m.evidence} /></>} />
        <Section title="Allergies" items={x.allergies} render={(a) => <>{a.substance}{a.reaction ? ` · ${a.reaction}` : ''}<Evidence text={a.evidence} /></>} />
        <Section title="Exams" items={x.exams} render={(e) => <>{e.date ? `${e.date} · ` : ''}{e.type}{e.summary ? ` · ${e.summary}` : ''}</>} />
      </div>
      <Section
        title="Lab and blood test results"
        items={x.labs}
        render={(l) => (
          <span className="font-mono">
            {l.name}: {l.value} {l.unit || ''} {l.referenceRange ? `(ref ${l.referenceRange})` : ''} {l.flag ? `[${l.flag}]` : ''} {l.date ? `· ${l.date}` : ''}
          </span>
        )}
      />
      <Section title="Medical history" items={x.history} render={(h) => h} />
      {x.notes && <p className="text-sm text-oc-gray">Reader notes: {x.notes}</p>}
    </section>
  )
}

export default function Records() {
  const { db, astronaut, addRecord, removeRecord } = useMission()
  const records = getRecords(db, astronaut.id)
  const fileRef = useRef(null)
  const [state, setState] = useState({ step: 'idle' }) // idle | reading | confirm | error | saved
  const configured = assistantConfigured()

  async function onFile(file) {
    if (!file) return
    if (!SUPPORTED_RECORD_TYPES.includes(file.type)) return setState({ step: 'error', message: 'Unsupported file. Use a PDF, PNG, JPEG, WebP or GIF.' })
    if (file.size > MAX_RECORD_BYTES) return setState({ step: 'error', message: 'File too large. The limit is 10 MB.' })
    setState({ step: 'reading', fileName: file.name })
    try {
      const extracted = await extractMedicalRecord(file)
      if (!extracted.readable) return setState({ step: 'error', message: 'The record could not be read. Upload a clearer scan or the original PDF.' })
      if (!extracted.isMedicalRecord) return setState({ step: 'error', message: 'This file does not look like a medical record. Nothing was saved.' })
      const pending = { fileName: file.name, fileType: file.type, sizeBytes: file.size, extracted }
      if (nameMismatch(extracted.patientName, astronaut.name)) return setState({ step: 'confirm', pending })
      addRecord(pending)
      setState({ step: 'saved', fileName: file.name })
    } catch (e) {
      setState({ step: 'error', message: e.message || 'The record could not be read.' })
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div className="max-w-5xl space-y-6">
      <PageTitle title="Medical Records" accent="Records" />
      <p className="text-oc-gray">
        Upload a medical record for {astronaut.name}. The AI assistant reads it into conditions, medications, allergies, lab results and exam dates, saves them to this profile only, and can answer questions about them at once. Check every item against the original document.
      </p>

      <section className={`${CARD} space-y-3`}>
        <p className={LABEL}>Upload a record</p>
        <input ref={fileRef} type="file" accept={SUPPORTED_RECORD_TYPES.join(',')} className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        <div className="flex flex-wrap items-center gap-3">
          <button className={BTN_PRIMARY} disabled={!configured || state.step === 'reading'} onClick={() => fileRef.current?.click()}>
            Choose file
          </button>
          <span className="text-sm text-oc-gray">PDF or image (PNG, JPEG, WebP), up to 10 MB.</span>
        </div>
        {!configured && <p className="text-sm text-oc-gray">Record reading unavailable. No Claude API key is configured on this device.</p>}
        {state.step === 'reading' && <p className="text-sm text-white" aria-live="polite">Reading {state.fileName}…</p>}
        {state.step === 'saved' && <p className="text-sm text-white">Saved {state.fileName}. The assistant can now use it.</p>}
        {state.step === 'error' && <p className="text-sm text-oc-gray">{state.message}</p>}
        {state.step === 'confirm' && (
          <div className="rounded border border-oc-border p-3">
            <p className="text-sm text-white">
              This record names <strong>{state.pending.extracted.patientName}</strong>, not {astronaut.name}. Save it to {astronaut.name}'s profile anyway?
            </p>
            <div className="mt-2 flex gap-2">
              <button className={BTN} onClick={() => { addRecord(state.pending); setState({ step: 'saved', fileName: state.pending.fileName }) }}>Save anyway</button>
              <button className={BTN_OUTLINE} onClick={() => setState({ step: 'idle' })}>Discard</button>
            </div>
          </div>
        )}
        <p className="text-xs text-oc-gray">The file is sent to the Claude API to be read. Only the extracted information is kept on this device; the file itself is not stored.</p>
      </section>

      {records.length === 0 ? (
        <p className="text-oc-gray">No records uploaded for {astronaut.name}.</p>
      ) : (
        records.map((r) => <RecordView key={r.id} record={r} onRemove={() => removeRecord(r.id)} />)
      )}
    </div>
  )
}
