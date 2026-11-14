import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { formatReplyEstimate } from '../engine/responseLevel.js'
import { followDataNodes } from '../engine/symptomRunner.js'
import { useMission } from '../store/MissionContext.jsx'
import { HazardTags, StatusPill } from './StatusPill.jsx'
import { BTN, BTN_DANGER, BTN_PRIMARY, CARD, H2, STATUS } from './ui.js'

// Runs ANY tree from data/symptomTrees.js.
// Data nodes are answered automatically, questions wait for Yes / No, results end the run.
export default function TreeRunner({ tree, onRestart }) {
  const { getCheckContext, responseLevel, comms, astronaut, logSymptom } = useMission()

  // state = where we are in the tree + the list of steps so far
  const [state, setState] = useState(() => {
    const first = followDataNodes(tree, tree.start, getCheckContext())
    return { nodeId: first.nodeId, trail: first.steps }
  })
  const node = tree.nodes[state.nodeId]

  function answer(yes) {
    const next = followDataNodes(tree, yes ? node.yes : node.no, getCheckContext())
    setState((prev) => ({
      nodeId: next.nodeId,
      trail: [...prev.trail, { kind: 'question', label: node.text, result: yes }, ...next.steps],
    }))
  }

  // Save the result to the symptom log once (it goes into emergency reports).
  const logged = useRef(false)
  useEffect(() => {
    if (node.type === 'result' && !logged.current) {
      logged.current = true
      logSymptom({ astronautId: astronaut.id, symptom: tree.label, title: node.title, hazards: node.hazards, level: node.level })
    }
  }, [node, tree, astronaut, logSymptom])

  return (
    <div className="space-y-4">
      {/* What has been checked so far */}
      {state.trail.length > 0 && (
        <section className={CARD}>
          <h2 className={H2}>What was checked</h2>
          <ol className="mt-3 space-y-2">
            {state.trail.map((step, i) => (
              <li key={i} className="flex gap-3">
                <span className={`mt-0.5 w-10 shrink-0 text-sm font-bold ${step.result ? 'text-amber-300' : 'text-slate-400'}`}>{step.result ? 'YES' : 'NO'}</span>
                <span>
                  <span className="text-slate-100">{step.label}</span>
                  {step.kind === 'data' && <span className="block text-sm text-slate-400">Checked automatically: {step.detail}</span>}
                  {step.kind === 'question' && <span className="block text-sm text-slate-400">Your answer</span>}
                </span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* A question for the astronaut */}
      {node.type === 'question' && (
        <section className={`${CARD} border-sky-500/50`}>
          <p className="text-sm font-semibold uppercase tracking-wide text-sky-400">Question</p>
          <p className="mt-2 text-2xl font-semibold text-white">{node.text}</p>
          <div className="mt-5 flex gap-3">
            <button className={`${BTN_PRIMARY} px-10 py-3 text-lg`} onClick={() => answer(true)}>Yes</button>
            <button className={`${BTN} px-10 py-3 text-lg`} onClick={() => answer(false)}>No</button>
          </div>
        </section>
      )}

      {/* The result */}
      {node.type === 'result' && (
        <section className={`rounded-xl border p-5 ${STATUS[node.level].border} ${STATUS[node.level].bg}`}>
          <div className="flex flex-wrap items-center gap-3">
            <StatusPill level={node.level} />
            <HazardTags hazards={node.hazards} />
          </div>
          <p className={`mt-3 text-2xl font-bold ${STATUS[node.level].text}`}>{node.title}</p>

          <p className="mt-4 font-semibold text-white">What to do</p>
          <ol className="mt-1 list-decimal space-y-1 pl-6 text-slate-100">
            {node.actions.map((action) => (
              <li key={action}>{action}</li>
            ))}
          </ol>

          {node.escalate && (
            <div className="mt-4 rounded-lg border border-red-500/60 bg-red-500/10 p-4">
              <p className="font-bold text-red-300">Escalate · {responseLevel.label}</p>
              <p className="mt-1 text-slate-100">{responseLevel.redInstruction}</p>
              <p className="mt-1 text-sm text-slate-300">{formatReplyEstimate(comms)}</p>
              <Link to="/emergency" className={`${BTN_DANGER} mt-3`}>Open Emergency mode</Link>
            </div>
          )}

          <p className="mt-4 text-sm text-slate-400">Saved to your symptom log.</p>
          <button className={`${BTN} mt-3`} onClick={onRestart}>Check another symptom</button>
        </section>
      )}
    </div>
  )
}
