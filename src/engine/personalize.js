// Personalization: turns a profile (age, gender, weight, height, medical history) into
//   1. an ESTIMATED Earth baseline (used until real pre-mission numbers are entered), and
//   2. an "attention level": how early the status engine flags drift from that baseline.
// No React in here. ALL FORMULAS ARE PLACEHOLDERS: verify with a clinician before real use.

const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), hi)
const round1 = (n) => Math.round(n * 10) / 10

export function bmi(p) {
  if (!p?.weightKg || !p?.heightCm) return null
  return p.weightKg / (p.heightCm / 100) ** 2
}

// Starting baseline from the profile. Every value stays inside its green range
// (see data/thresholds.js) so a new astronaut does not start out flagged.
export function estimateBaseline(p) {
  const excess = clamp((bmi(p) ?? 22) - 25, 0, 10) // BMI points above 25
  const age = clamp(p.age, 18, 80)
  const female = p.gender === 'Female' ? 1 : p.gender === 'Male' ? 0 : 0.5

  return {
    heartRate: Math.round(clamp(62 + 3 * female + 0.6 * excess, 50, 85)),
    bloodPressure: {
      systolic: Math.round(clamp(108 + 0.4 * (age - 20) + excess - 4 * female, 95, 125)),
      diastolic: Math.round(clamp(70 + 0.15 * (age - 20) + 0.5 * excess, 62, 82)),
    },
    bloodSugar: Math.round(clamp(86 + 0.2 * (age - 20) + 0.5 * excess, 75, 105)),
    temperature: round1(36.8 - 0.1 * female),
    sleep: 7.5,
    mood: 4,
  }
}

// Replace estimated numbers with any the astronaut actually knows.
// overrides: { heartRate, systolic, diastolic, bloodSugar, temperature, sleep, mood }, '' = keep estimate.
export function applyOverrides(estimated, overrides = {}) {
  const pick = (key, fallback) => {
    const raw = overrides[key]
    return raw === '' || raw == null || Number.isNaN(Number(raw)) ? fallback : Number(raw)
  }
  return {
    heartRate: pick('heartRate', estimated.heartRate),
    bloodPressure: {
      systolic: pick('systolic', estimated.bloodPressure.systolic),
      diastolic: pick('diastolic', estimated.bloodPressure.diastolic),
    },
    bloodSugar: pick('bloodSugar', estimated.bloodSugar),
    temperature: pick('temperature', estimated.temperature),
    sleep: pick('sleep', estimated.sleep),
    mood: pick('mood', estimated.mood),
  }
}

// Attention level. scale multiplies the "how far from baseline" limits in the status
// engine: 1 = standard, lower = flags smaller changes. Reasons are shown to the astronaut.
export function attentionProfile(p) {
  let scale = 1
  const reasons = []
  const b = bmi(p)

  if (p?.age >= 50) {
    scale -= 0.1
    reasons.push(`Age ${p.age}: small changes matter more.`)
  }
  if (p?.age >= 65) {
    scale -= 0.1
    reasons.push('Age 65 or older: even stricter watching.')
  }
  if (b != null && (b >= 30 || b < 18.5)) {
    scale -= 0.1
    reasons.push(`BMI ${b.toFixed(1)} is outside 18.5-30.`)
  }
  if (p?.medical?.conditions?.length) {
    scale -= 0.1
    reasons.push('Medical conditions on file.')
  }

  scale = Math.max(round1(scale), 0.7)
  const label = scale >= 1 ? 'Standard' : scale >= 0.9 ? 'Elevated' : 'High'
  return { scale, label, reasons }
}
