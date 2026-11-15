import { useState } from 'react'
import TreeRunner from '../components/TreeRunner.jsx'
import PageTitle from '../components/PageTitle.jsx'
import { LABEL } from '../components/ui.js'
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
        <PageTitle title="Symptom Checker" accent="Checker" />
        <p className="mt-3 text-oc-gray">
          Tell the app what you feel. It checks the cabin, radiation, gravity and your own logs, then points to the most likely cause and what to do. Works with no link to Earth.
        </p>
      </div>

      <div>
        <p className={`${LABEL} mb-3 text-white`}>What are you feeling?</p>
        <div className="flex flex-wrap gap-2">
          {Object.entries(SYMPTOM_TREES).map(([id, tree]) => (
            <button
              key={id}
              onClick={() => start(id)}
              className={`cursor-pointer rounded border px-5 py-3 text-lg font-semibold ${id === symptomId ? 'border-oc-blue bg-oc-panel text-white' : 'border-oc-border/60 text-white/85 hover:bg-oc-panel/40 hover:text-white'}`}
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
