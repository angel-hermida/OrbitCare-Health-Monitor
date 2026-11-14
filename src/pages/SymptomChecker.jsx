import { useState } from 'react'
import TreeRunner from '../components/TreeRunner.jsx'
import { H1 } from '../components/ui.js'
import { SYMPTOM_TREES } from '../data/symptomTrees.js'

// Pick a symptom, then TreeRunner walks its decision tree.
// It checks app data first (cabin, radiation, gravity, sleep, mood) and only asks what it cannot know.
export default function SymptomChecker() {
  const [symptomId, setSymptomId] = useState(null)
  const [run, setRun] = useState(0) // changes on every start, so TreeRunner begins fresh

  function start(id) {
    setSymptomId(id)
    setRun((n) => n + 1)
  }

  return (
    <div className="max-w-3xl space-y-5">
      <div>
        <h1 className={H1}>Symptom checker</h1>
        <p className="mt-1 text-slate-300">
          Tell the app what you feel. It checks the cabin, radiation, gravity and your own logs, then points to the most likely cause and what to do. Works with no link to Earth.
        </p>
      </div>

      <div>
        <p className="mb-2 font-semibold text-white">What are you feeling?</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(SYMPTOM_TREES).map(([id, tree]) => (
            <button
              key={id}
              onClick={() => start(id)}
              className={`cursor-pointer rounded-lg border px-5 py-3 text-lg font-medium ${id === symptomId ? 'border-sky-400 bg-sky-500/15 text-sky-300' : 'border-slate-700 bg-slate-900 text-slate-200 hover:bg-slate-800'}`}
            >
              {tree.label}
            </button>
          ))}
        </div>
      </div>

      {symptomId && <TreeRunner key={run} tree={SYMPTOM_TREES[symptomId]} onRestart={() => setSymptomId(null)} />}
    </div>
  )
}
