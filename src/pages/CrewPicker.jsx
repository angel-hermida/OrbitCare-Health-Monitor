import { CREW } from '../data/crew.js'
import { useMission } from '../store/MissionContext.jsx'

// First screen: choose who is using the app.
export default function CrewPicker() {
  const { selectAstronaut } = useMission()

  return (
    <div className="mx-auto flex min-h-full max-w-4xl flex-col justify-center p-8">
      <p className="text-sm font-semibold uppercase tracking-wide text-sky-400">OrbitCare</p>
      <h1 className="mt-1 text-4xl font-bold text-white">Who is checking in?</h1>
      <p className="mt-2 text-slate-300">Pick your profile. Your readings are compared with your own Earth baseline.</p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {CREW.map((astronaut) => (
          <button
            key={astronaut.id}
            onClick={() => selectAstronaut(astronaut.id)}
            className="cursor-pointer rounded-xl border border-slate-800 bg-slate-900 p-6 text-left hover:border-sky-400 hover:bg-slate-800"
          >
            <p className="text-2xl font-semibold text-white">{astronaut.name}</p>
            <p className="mt-1 text-sky-300">{astronaut.role}</p>
            <p className="mt-2 text-sm text-slate-400">
              {astronaut.age} · {astronaut.gender} · {astronaut.weightKg} kg
            </p>
          </button>
        ))}
      </div>

      <p className="mt-10 text-center text-sm text-slate-400">Guidance tool. Does not replace flight surgeons.</p>
    </div>
  )
}
