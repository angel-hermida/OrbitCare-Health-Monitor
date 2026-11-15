// AI health assistant: a chat drawer on the right, opened from the top bar on every page.
// Conversation lives here while the app is open. It is cleared when the crew member switches
// (the whole app unmounts) and is never saved to localStorage.

import { AnimatePresence, motion } from 'motion/react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { assistantConfigured, runAssistantTurn, trimHistory } from '../engine/assistant/claude.js'
import { buildSystemPrompt } from '../engine/assistant/prompt.js'
import { createTools, TOOL_DEFINITIONS } from '../engine/assistant/tools.js'
import { useMission } from '../store/MissionContext.jsx'
import { usePreferences } from '../store/PreferencesContext.jsx'
import AssistantCard from './AssistantCards.jsx'
import { DURATION, EASE_OUT, useAnimationsEnabled } from './motion.jsx'
import { BTN_PRIMARY, INPUT_TEXT, LABEL } from './ui.js'

const SUGGESTIONS = [
  'What are my current vitals?',
  'Is anything outside its normal range?',
  'How has my heart rate changed this week?',
  'How many hours did I sleep last night?',
  'Is my resting heart rate increasing?',
  'Do I have any documented allergies?',
  'Take me to my trends',
  'How do I upload a medical record?',
]

// Minimal formatting for model text: **bold** and "- " bullet lines.
function RichText({ text }) {
  const lines = text.split('\n')
  return (
    <div className="space-y-1 text-sm leading-relaxed text-white">
      {lines.map((line, i) => {
        const bullet = /^\s*[-•*]\s+/.test(line)
        const body = line.replace(/^\s*[-•*]\s+/, '')
        const parts = body.split(/(\*\*[^*]+\*\*)/g).map((p, j) => (p.startsWith('**') && p.endsWith('**') ? <strong key={j}>{p.slice(2, -2)}</strong> : p))
        if (!line.trim()) return <div key={i} className="h-1" />
        return bullet ? (
          <p key={i} className="flex gap-2 pl-1"><span className="text-oc-blue">›</span><span>{parts}</span></p>
        ) : (
          <p key={i}>{parts}</p>
        )
      })}
    </div>
  )
}

export function useAssistantChat() {
  const mission = useMission()
  const { tempUnit } = usePreferences()
  const navigate = useNavigate()
  const [messages, setMessages] = useState([]) // what the chat shows: { role, text, cards, error }
  const [busy, setBusy] = useState(false)
  const history = useRef([]) // what the API sees
  const abort = useRef(null)

  // Tools read the latest app state at call time, always for the signed-in astronaut.
  const ctxRef = useRef(null)
  ctxRef.current = { db: mission.db, astronaut: mission.astronaut, missionState: mission.missionState, tempUnit, navigate, now: Date.now() }
  const tools = useMemo(() => ({ definitions: TOOL_DEFINITIONS, ...createTools(() => ({ ...ctxRef.current, now: Date.now() })) }), [])

  const send = useCallback(
    async (text) => {
      const q = text.trim()
      if (!q || busy) return
      setMessages((m) => [...m, { role: 'user', text: q }])
      setBusy(true)
      abort.current = new AbortController()
      try {
        const { astronaut, missionState } = ctxRef.current
        const out = await runAssistantTurn({
          system: buildSystemPrompt({ astronaut, missionState }),
          history: trimHistory(history.current),
          userText: q,
          tools,
          signal: abort.current.signal,
        })
        history.current = out.history
        setMessages((m) => [...m, { role: 'assistant', text: out.text, cards: out.cards }])
      } catch (e) {
        if (e.name !== 'AbortError') setMessages((m) => [...m, { role: 'assistant', error: true, text: e.message || 'Assistant error.' }])
      } finally {
        setBusy(false)
      }
    },
    [busy, tools]
  )

  const clear = useCallback(() => {
    abort.current?.abort()
    history.current = []
    setMessages([])
    setBusy(false)
  }, [])

  useEffect(() => () => abort.current?.abort(), [])
  return { messages, busy, send, clear }
}

export default function AssistantPanel({ open, onClose, chat }) {
  const { astronaut } = useMission()
  const enabled = useAnimationsEnabled()
  const [draft, setDraft] = useState('')
  const endRef = useRef(null)
  const inputRef = useRef(null)
  const { messages, busy, send, clear } = chat
  const configured = assistantConfigured()

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end', behavior: enabled ? 'smooth' : 'auto' })
  }, [messages, busy, enabled])

  useEffect(() => {
    if (open) inputRef.current?.focus()
  }, [open])

  const submit = (e) => {
    e.preventDefault()
    send(draft)
    setDraft('')
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.aside
          key="assistant"
          role="dialog"
          aria-label="Health assistant"
          initial={enabled ? { x: 40, opacity: 0 } : false}
          animate={{ x: 0, opacity: 1, transition: { duration: enabled ? DURATION.enter : 0, ease: EASE_OUT } }}
          exit={{ x: 40, opacity: 0, transition: { duration: enabled ? DURATION.exit : 0 } }}
          className="absolute top-0 right-0 bottom-0 z-40 flex w-full max-w-[26rem] flex-col border-l border-oc-border bg-oc-bg shadow-2xl shadow-black/40"
        >
          <div className="flex items-center justify-between gap-3 border-b border-oc-border/60 px-4 py-3">
            <div>
              <p className="text-lg font-bold text-white">
                Health <span className="text-oc-red">Assistant</span>
              </p>
              <p className="text-xs text-oc-gray">{astronaut.name} · AI · data from this device</p>
            </div>
            <div className="flex items-center gap-3">
              {messages.length > 0 && (
                <button onClick={clear} className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-oc-gray hover:text-white">
                  Clear
                </button>
              )}
              <button onClick={onClose} aria-label="Close assistant" className="cursor-pointer text-2xl leading-none text-oc-gray hover:text-white">
                ×
              </button>
            </div>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
            {!configured && (
              <p className="rounded border border-oc-border/70 bg-oc-panel/30 p-3 text-sm text-oc-gray">
                Assistant unavailable. No Claude API key is configured on this device. All other pages work as normal.
              </p>
            )}
            {messages.length === 0 && (
              <div>
                <p className="text-sm text-white">Ask about your readings, trends, medical records, or where to find something in OrbitCare.</p>
                <p className={`${LABEL} mt-4 mb-2`}>Suggested</p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      disabled={busy || !configured}
                      onClick={() => send(s)}
                      className="cursor-pointer rounded border border-oc-border/70 px-2.5 py-1.5 text-left text-xs text-white hover:border-oc-blue hover:bg-oc-panel/40 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) =>
              m.role === 'user' ? (
                <div key={i} className="flex justify-end">
                  <p className="max-w-[85%] rounded bg-oc-blue/90 px-3 py-2 text-sm text-oc-paper">{m.text}</p>
                </div>
              ) : (
                <div key={i} className="space-y-2">
                  {m.cards?.map((c, j) => <AssistantCard key={j} card={c} />)}
                  {m.error ? (
                    <p className="rounded border border-oc-border/70 bg-oc-panel/30 p-3 text-sm text-oc-gray">{m.text}</p>
                  ) : (
                    m.text && <RichText text={m.text} />
                  )}
                </div>
              )
            )}

            {busy && (
              <div className="flex items-center gap-2 text-sm text-oc-gray" aria-live="polite">
                <span className="flex gap-1">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-oc-blue" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-oc-blue [animation-delay:150ms]" />
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-oc-blue [animation-delay:300ms]" />
                </span>
                Checking your data
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form onSubmit={submit} className="border-t border-oc-border/60 p-3">
            <div className="flex gap-2">
              <input
                ref={inputRef}
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder={configured ? 'Ask a question' : 'Assistant unavailable'}
                disabled={!configured}
                className={`${INPUT_TEXT} text-sm`}
                aria-label="Message"
              />
              <button type="submit" disabled={busy || !draft.trim() || !configured} className={`${BTN_PRIMARY} px-4 disabled:cursor-not-allowed disabled:opacity-50`}>
                Send
              </button>
            </div>
            <p className="mt-2 text-[11px] leading-snug text-oc-gray">Information only. Not a diagnosis. For urgent concerns, follow the medical escalation protocol and notify the crew medical officer (CMO).</p>
          </form>
        </motion.aside>
      )}
    </AnimatePresence>
  )
}
