import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { daysToNextDrop, getDemoMessages, isNew } from '../engine/memoryBank.js'
import { useMission } from '../store/MissionContext.jsx'
import { addUpload, getUploads, typeForFile } from '../store/memoryUploads.js'
import PageTitle from './PageTitle.jsx'
import { BTN, BTN_OUTLINE, BTN_PRIMARY, CARD, INPUT_TEXT, LABEL } from './ui.js'

// Memory bank: messages from home for the signed-in astronaut. Always open, never locked.
// Demo messages come from data/memoryBank.js, uploads ("Uplinked") from IndexedDB.
export default function MemoryBank() {
  const { astronaut, missionDay, db, markMemoryOpened } = useMission()
  const opened = db.memoryOpened ?? []
  const [uploads, setUploads] = useState([])
  const [openId, setOpenId] = useState(null)
  const [adding, setAdding] = useState(false)

  const reloadUploads = useCallback(() => {
    getUploads(astronaut.id)
      .then(setUploads)
      .catch(() => setUploads([]))
  }, [astronaut.id])

  useEffect(reloadUploads, [reloadUploads])

  // Object URLs for uploaded files, freed when the list changes.
  const uploadMessages = useMemo(
    () =>
      uploads.map((u) => ({
        id: u.id,
        astronautId: u.astronautId,
        from: u.from,
        type: u.type,
        text: u.text,
        mediaUrl: URL.createObjectURL(u.blob),
        dropDay: u.dropDay,
        uplinked: true,
      })),
    [uploads]
  )
  useEffect(() => () => uploadMessages.forEach((m) => URL.revokeObjectURL(m.mediaUrl)), [uploadMessages])

  const { arrived, pending } = getDemoMessages(astronaut.id, missionDay)
  const messages = [...uploadMessages.slice().reverse(), ...arrived]
  const nextDrop = daysToNextDrop(pending, missionDay)
  const newCount = messages.filter((m) => isNew(m, missionDay, opened)).length
  const current = messages.find((m) => m.id === openId)

  function openMessage(message) {
    setOpenId(message.id)
    markMemoryOpened(message.id)
  }

  return (
    <section className={CARD}>
      <PageTitle title="Memory bank" accent="Memory" as="h2" size="text-2xl" />
      <p className="mt-3 max-w-3xl text-oc-gray">Messages from home. Open them any time.</p>

      <div className="mt-4 flex flex-wrap items-center gap-x-6 gap-y-3">
        <div>
          <p className={LABEL}>Next family drop</p>
          <p className="mt-1 font-mono text-xl text-white">
            {nextDrop === null ? 'No messages in transit' : nextDrop === 1 ? 'In 1 day' : `In ${nextDrop} days`}
          </p>
        </div>
        {newCount > 0 && (
          <div>
            <p className={LABEL}>New</p>
            <p className="mt-1 font-mono text-xl text-oc-blue">{newCount}</p>
          </div>
        )}
        <button className={`${BTN_OUTLINE} ml-auto`} onClick={() => setAdding(true)}>
          Add from home
        </button>
      </div>

      {messages.length === 0 ? (
        <p className="mt-5 text-oc-gray">No messages yet. The first family drop is on its way.</p>
      ) : (
        <ul className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {messages.map((message) => (
            <li key={message.id}>
              <MessageCard message={message} isNew={isNew(message, missionDay, opened)} onOpen={() => openMessage(message)} />
            </li>
          ))}
        </ul>
      )}

      {current && <MessageView message={current} onClose={() => setOpenId(null)} />}
      {adding && (
        <AddFromHome
          astronautId={astronaut.id}
          missionDay={missionDay}
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false)
            reloadUploads()
          }}
        />
      )}
    </section>
  )
}

function TypeIcon({ type, className = 'h-8 w-8' }) {
  const common = { className, fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, viewBox: '0 0 24 24', 'aria-hidden': true }
  if (type === 'audio')
    return (
      <svg {...common}>
        <path d="M9 18V6l10-2v12" />
        <circle cx="6.5" cy="18" r="2.5" />
        <circle cx="16.5" cy="16" r="2.5" />
      </svg>
    )
  if (type === 'video')
    return (
      <svg {...common}>
        <rect x="3" y="6" width="13" height="12" rx="1" />
        <path d="M16 10l5-3v10l-5-3z" />
      </svg>
    )
  return (
    <svg {...common}>
      <rect x="3" y="5" width="18" height="14" rx="1" />
      <path d="M3 7l9 6 9-6" />
    </svg>
  )
}

function MessageCard({ message, isNew, onOpen }) {
  return (
    <button
      onClick={onOpen}
      className="flex h-full w-full cursor-pointer flex-col overflow-hidden rounded border border-oc-border/70 bg-oc-bg/40 text-left transition-colors duration-150 hover:border-oc-blue"
    >
      {message.type === 'photo' ? (
        <img src={message.mediaUrl} alt={`Photo from ${message.from}`} className="h-40 w-full rounded-t object-cover" loading="lazy" />
      ) : (
        <div className="flex h-40 w-full items-center justify-center bg-oc-panel/40 text-oc-blue">
          <TypeIcon type={message.type} />
        </div>
      )}
      <div className="flex flex-1 flex-col p-4">
        <div className="flex flex-wrap items-center gap-2">
          {isNew && <span className="rounded border border-oc-blue px-1.5 py-0.5 text-xs font-bold uppercase tracking-wider text-oc-blue">New</span>}
          {message.uplinked && <span className="rounded border border-oc-border px-1.5 py-0.5 text-xs font-bold uppercase tracking-wider text-oc-gray">Uplinked</span>}
          <span className="font-mono text-xs text-oc-gray">Day {message.dropDay}</span>
        </div>
        <p className="mt-2 font-semibold text-white">{message.from}</p>
        {message.text && <p className="mt-1 line-clamp-2 text-sm text-oc-gray">{message.text}</p>}
      </div>
    </button>
  )
}

function Dialog({ label, onClose, children }) {
  const closeRef = useRef(null)
  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded border border-oc-border bg-oc-bg p-5"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
        <button ref={closeRef} className={`${BTN} mt-5`} onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  )
}

function MessageView({ message, onClose }) {
  return (
    <Dialog label={`Message from ${message.from}`} onClose={onClose}>
      <p className={LABEL}>
        {message.uplinked ? 'Uplinked' : 'Message from home'} · Day {message.dropDay}
      </p>
      <p className="mt-1 text-2xl font-bold text-white">{message.from}</p>
      {message.type === 'photo' && <img src={message.mediaUrl} alt={`Photo from ${message.from}`} className="mt-4 max-h-[60vh] w-full rounded object-contain" />}
      {message.type === 'audio' && <audio src={message.mediaUrl} controls className="mt-4 w-full" />}
      {message.type === 'video' && <video src={message.mediaUrl} controls className="mt-4 max-h-[60vh] w-full rounded" />}
      {message.text && <p className="mt-4 whitespace-pre-line text-white">{message.text}</p>}
    </Dialog>
  )
}

function AddFromHome({ astronautId, missionDay, onClose, onSaved }) {
  const [file, setFile] = useState(null)
  const [from, setFrom] = useState('')
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  async function save(e) {
    e.preventDefault()
    const type = file && typeForFile(file)
    if (!type) return setError('Choose a photo, audio or video file.')
    if (!from.trim()) return setError('Enter who the message is from.')
    setSaving(true)
    try {
      await addUpload({
        id: `up-${Date.now()}`,
        astronautId,
        from: from.trim(),
        text: note.trim(),
        type,
        blob: file,
        fileName: file.name,
        dropDay: missionDay,
        createdAt: Date.now(),
      })
      onSaved()
    } catch {
      setSaving(false)
      setError('Could not save the file on this device. Try a smaller file.')
    }
  }

  return (
    <Dialog label="Add from home" onClose={onClose}>
      <PageTitle title="Add from home" accent="home" as="h2" size="text-2xl" />
      <form className="mt-4 space-y-4" onSubmit={save}>
        <label className="block">
          <span className={LABEL}>Photo, audio or video</span>
          <input
            type="file"
            accept="image/*,audio/*,video/*"
            className="mt-2 block w-full text-sm text-oc-gray file:mr-3 file:cursor-pointer file:rounded file:border-0 file:bg-oc-blue file:px-4 file:py-2 file:font-bold file:text-oc-paper"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null)
              setError('')
            }}
          />
        </label>
        <label className="block">
          <span className={LABEL}>From</span>
          <input className={`${INPUT_TEXT} mt-2`} value={from} onChange={(e) => setFrom(e.target.value)} placeholder="e.g. Mom" />
        </label>
        <label className="block">
          <span className={LABEL}>Note (optional)</span>
          <textarea className={`${INPUT_TEXT} mt-2`} rows={3} value={note} onChange={(e) => setNote(e.target.value)} />
        </label>
        {error && <p className="text-sm font-semibold text-white" role="alert">{error}</p>}
        <button type="submit" className={BTN_PRIMARY} disabled={saving}>
          {saving ? 'Saving' : 'Save to memory bank'}
        </button>
      </form>
    </Dialog>
  )
}
