import { useState } from 'react'
import { Link } from 'react-router-dom'
import { BTN, LEVEL_BADGE } from '../components/ui.js'
import { EMERGENCIES } from '../data/emergencies.js'
import { buildReport } from '../engine/report.js'
import { formatDelay, formatReplyEstimate } from '../engine/responseLevel.js'
import { useMission } from '../store/MissionContext.jsx'

const BIG_BTN = 'cursor-pointer rounded-xl px-8 py-4 text-xl font-bold'

// Full-screen emergency mode: pick what is happening -> one step at a time -> report to ground.
export default function Emergency() {
  const mission = useMission()
  const { db, astronaut, environment, comms, responseLevel } = mission
  const [scenario, setScenario] = useState(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [report, setReport] = useState(null)
  const [copied, setCopied] = useState(false)

  // The radiation scenario's first step depends on where the crew is.
  const steps = scenario ? (scenario.usesShelterAdvice ? [environment.shelter, ...scenario.steps.slice(1)] : scenario.steps) : []
  const isLast = stepIndex === steps.length - 1

  function start(next) {
    setScenario(next)
    setStepIndex(0)
    setReport(null)
    setCopied(false)
  }

  function finish() {
    setReport(buildReport({ db, astronaut, scenario, stepsDone: steps, mission }))
  }

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(report)
      setCopied(true)
    } catch {
      setCopied(false) // clipboard blocked: the text can still be selected by hand
    }
  }

  return (
    <div className="oc-app min-h-full bg-red-950/40">
      <header className="flex flex-wrap items-center justify-between gap-4 bg-red-600 px-6 py-4">
        <div>
          <p className="text-2xl font-black tracking-wide text-white">EMERGENCY MODE</p>
          <p className="text-red-100">{astronaut.name} · {environment.name}</p>
        </div>
        <Link to="/" className="rounded-lg border border-white/60 px-4 py-2 font-semibold text-white hover:bg-white/10">Exit emergency mode</Link>
      </header>

      <div className="mx-auto max-w-4xl space-y-5 p-6">
        {/* Who knows, and who leads */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-xl border border-amber-400/60 bg-amber-400/10 p-4">
            <p className="font-bold text-amber-300">Crew alerted</p>
            <p className="text-slate-100">Every crew member has been notified that {astronaut.name} needs help.</p>
            <p className="mt-1 text-xs text-slate-400">Simulated in this prototype.</p>
          </div>
          <div className="rounded-xl border border-slate-700 bg-slate-900 p-4">
            <p className="flex flex-wrap items-center gap-2 font-bold text-white">
              Who leads
              <span className={`rounded border-2 px-2 py-0.5 text-xs font-bold uppercase tracking-wider ${LEVEL_BADGE[responseLevel.id]}`}>{responseLevel.label}</span>
            </p>
            <p className="text-slate-100">{responseLevel.redInstruction}</p>
            <p className="mt-1 text-sm text-slate-400">Delay to Earth: {formatDelay(comms)}</p>
          </div>
        </div>

        {/* 1. Choose the scenario */}
        {!scenario && (
          <section>
            <h1 className="text-3xl font-bold text-white">What is happening?</h1>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {EMERGENCIES.map((item) => (
                <button key={item.id} onClick={() => start(item)} className="cursor-pointer rounded-xl border-2 border-red-500/60 bg-slate-900 p-6 text-left hover:bg-red-900/40">
                  <p className="text-2xl font-bold text-white">{item.title}</p>
                  <p className="mt-1 text-slate-300">{item.summary}</p>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* 2. One step at a time */}
        {scenario && !report && (
          <section className="rounded-xl border-2 border-red-500/60 bg-slate-900 p-8">
            <p className="font-semibold uppercase tracking-wide text-red-300">
              {scenario.title} · Step {stepIndex + 1} of {steps.length}
            </p>
            <p className="mt-4 min-h-28 text-3xl font-semibold leading-snug text-white">{steps[stepIndex]}</p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              {stepIndex > 0 && (
                <button className={`${BIG_BTN} border border-slate-600 bg-slate-800 text-white hover:bg-slate-700`} onClick={() => setStepIndex(stepIndex - 1)}>Back</button>
              )}
              {!isLast && (
                <button className={`${BIG_BTN} bg-white text-slate-950 hover:bg-slate-200`} onClick={() => setStepIndex(stepIndex + 1)}>Next step</button>
              )}
              {isLast && (
                <button className={`${BIG_BTN} bg-oc-blue text-white hover:bg-oc-blue/85`} onClick={finish}>Done · Build report</button>
              )}
              <button className="ml-auto cursor-pointer text-slate-300 underline hover:text-white" onClick={() => setScenario(null)}>Choose a different emergency</button>
            </div>
            <p className="mt-6 text-xs text-slate-400">Placeholder protocol for the prototype. Not verified medical guidance.</p>
          </section>
        )}

        {/* 3. Packaged report for ground */}
        {report && (
          <section className="rounded-xl border border-slate-700 bg-slate-900 p-6">
            <h2 className="text-2xl font-bold text-white">Report to ground</h2>
            <p className="mt-1 text-slate-300">
              One message with everything ground needs. {comms.blackout ? 'Queued: it will be sent when contact returns.' : `Sent. It arrives in ${formatDelay(comms).replace(' one way', '')}.`}
            </p>
            <p className="font-semibold text-sky-300">{formatReplyEstimate(comms)}</p>

            <pre className="mt-4 max-h-96 overflow-auto rounded-lg border border-slate-700 bg-slate-950 p-4 text-sm leading-relaxed whitespace-pre-wrap text-slate-200">{report}</pre>

            <div className="mt-4 flex flex-wrap gap-3">
              <button className={BTN} onClick={copyReport}>{copied ? 'Copied' : 'Copy report'}</button>
              <button className={BTN} onClick={() => setScenario(null)}>Handle another emergency</button>
              <Link to="/" className={BTN}>Back to dashboard</Link>
            </div>
          </section>
        )}

        <p className="pt-2 text-center text-sm text-slate-400">Guidance tool. Does not replace flight surgeons.</p>
      </div>
    </div>
  )
}
