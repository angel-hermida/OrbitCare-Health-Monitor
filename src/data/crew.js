// Preset crew for the demo. Names are invented.
// Custom astronauts made in the app are stored in the db (see store/storage.js addAstronaut).
// "baseline" = each astronaut's own pre-mission (Earth) readings.
// The status engine compares every new reading against these.

export const CREW = [
  {
    id: 'a1',
    name: 'Maya Okafor',
    role: 'Commander',
    age: 41,
    gender: 'Female',
    weightKg: 63,
    heightCm: 168,
    baseline: {
      heartRate: 62,
      bloodPressure: { systolic: 112, diastolic: 72 },
      bloodSugar: 88,
      temperature: 36.7,
      sleep: 7.5,
      mood: 4,
    },
  },
  {
    id: 'a2',
    name: 'Daniel Reyes',
    role: 'Flight Engineer',
    age: 36,
    gender: 'Male',
    weightKg: 79,
    heightCm: 180,
    baseline: {
      heartRate: 64,
      bloodPressure: { systolic: 118, diastolic: 76 },
      bloodSugar: 92,
      temperature: 36.8,
      sleep: 7.0,
      mood: 4,
    },
  },
  {
    id: 'a3',
    name: 'Aiko Tanaka',
    role: 'Crew Medical Officer',
    age: 38,
    gender: 'Female',
    weightKg: 58,
    heightCm: 160,
    baseline: {
      heartRate: 63,
      bloodPressure: { systolic: 108, diastolic: 70 },
      bloodSugar: 86,
      temperature: 36.7,
      sleep: 7.5,
      mood: 4,
    },
  },
  {
    id: 'a4',
    name: 'Sam Whitfield',
    role: 'Mission Specialist',
    age: 45,
    gender: 'Male',
    weightKg: 84,
    heightCm: 182,
    baseline: {
      heartRate: 66,
      bloodPressure: { systolic: 118, diastolic: 76 },
      bloodSugar: 95,
      temperature: 36.8,
      sleep: 7.0,
      mood: 4,
    },
  },
]

export function getAstronaut(id) {
  return CREW.find((a) => a.id === id) || null
}
