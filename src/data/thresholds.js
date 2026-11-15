// ALL NUMBERS IN THIS FILE ARE PLACEHOLDERS.
// They are general adult reference ranges, not NASA flight rules.
// Before the demo: verify each one, then fill in its `source` field.
//
// How a range works:
//   green:  [low, high]  -> inside = normal
//   yellow: [low, high]  -> inside (but outside green) = caution; outside = red
//   null means "no limit on that side" (e.g. mood has no upper limit)
//
// tightenStep: how much each range shrinks per response level (see engine/responseLevel.js).
//   Ground-led = 0 steps, Shared = 1, Crew-led = 2, Fully autonomous = 3.
//   Farther from Earth -> narrower ranges -> the crew acts earlier.
//
// baseline: how far from the astronaut's OWN Earth baseline counts as caution / alert.
//   Values are in the indicator's own unit (not percent).
//   direction 'low' = only a drop below baseline matters.

export const THRESHOLDS = {
  heartRate: {
    label: 'Heart rate',
    unit: 'bpm',
    hazards: ['G'],
    green: [50, 100], // TODO: verify + cite source
    yellow: [45, 120], // TODO: verify + cite source
    tightenStep: 2,
    baseline: { yellow: 20, red: 35, direction: 'both' }, // TODO: verify + cite source
    source: '',
    input: { min: 20, max: 250, step: 1 },
    text: {
      green: { message: 'Resting heart rate within your normal range.', action: 'No action required. Continue scheduled checks.' },
      yellowLow: { message: 'Heart rate below your normal range.', action: 'Rest 10 min, then re-measure. Report any dizziness.' },
      yellowHigh: { message: 'Heart rate above your normal range.', action: 'Stay still 10 min. Breathe slowly. Drink water. Re-measure.' },
      redLow: { message: 'Heart rate far below a safe resting level.', action: 'Stop activity. Stay restrained. Notify the crew medical officer (CMO) now.' },
      redHigh: { message: 'Heart rate far above a safe resting level.', action: 'Stop all activity. Stay restrained. Notify the crew medical officer (CMO) now.' },
    },
  },

  bloodPressure: {
    label: 'Blood pressure',
    unit: 'mmHg',
    hazards: ['G'],
    // Blood pressure has two numbers, so each part gets its own ranges.
    parts: {
      systolic: {
        label: 'Systolic (top number)',
        green: [90, 129], // TODO: verify + cite source
        yellow: [85, 149], // TODO: verify + cite source
        tightenStep: 2,
        baseline: { yellow: 20, red: 35, direction: 'both' }, // TODO: verify + cite source
      },
      diastolic: {
        label: 'Diastolic (bottom number)',
        green: [60, 84], // TODO: verify + cite source
        yellow: [55, 94], // TODO: verify + cite source
        tightenStep: 1,
        baseline: { yellow: 12, red: 20, direction: 'both' }, // TODO: verify + cite source
      },
    },
    source: '',
    input: { min: 40, max: 260, step: 1 },
    text: {
      green: { message: 'Blood pressure within your normal range.', action: 'No action required. Continue scheduled checks.' },
      yellowLow: { message: 'Blood pressure below your normal range.', action: 'Drink water. Change position slowly. Re-measure in 30 min.' },
      yellowHigh: { message: 'Blood pressure above your normal range.', action: 'Rest 15 min. No caffeine or salty food. Re-measure.' },
      redLow: { message: 'Blood pressure dangerously low.', action: 'Stay restrained. Do not move around alone. Notify the crew medical officer (CMO) now.' },
      redHigh: { message: 'Blood pressure dangerously high.', action: 'Stop all activity and rest. Notify the crew medical officer (CMO) now. Report chest pain, severe headache or vision changes.' },
    },
  },

  bloodSugar: {
    label: 'Blood sugar',
    unit: 'mg/dL',
    hazards: ['E'],
    green: [70, 140], // TODO: verify + cite source (does not yet separate fasting / after meals)
    yellow: [60, 180], // TODO: verify + cite source
    tightenStep: 3,
    baseline: { yellow: 45, red: 80, direction: 'both' }, // TODO: verify + cite source
    source: '',
    input: { min: 20, max: 600, step: 1 },
    text: {
      green: { message: 'Blood sugar within normal range.', action: 'No action required. Eat meals on schedule.' },
      yellowLow: { message: 'Blood sugar below normal.', action: 'Take a sugary food or drink now. Re-measure in 15 min.' },
      yellowHigh: { message: 'Blood sugar above normal.', action: 'Drink water. Log what you ate. Re-measure before the next meal.' },
      redLow: { message: 'Blood sugar dangerously low.', action: 'Take glucose gel now. Notify the crew medical officer (CMO) now.' },
      redHigh: { message: 'Blood sugar dangerously high.', action: 'Drink water. No exercise. Notify the crew medical officer (CMO) now.' },
    },
  },

  temperature: {
    label: 'Body temperature',
    unit: '°C',
    hazards: ['E', 'R'],
    green: [36.1, 37.5], // TODO: verify + cite source
    yellow: [35.5, 38.2], // TODO: verify + cite source
    tightenStep: 0.1,
    baseline: { yellow: 0.8, red: 1.5, direction: 'both' }, // TODO: verify + cite source
    source: '',
    input: { min: 30, max: 43, step: 0.1 },
    text: {
      green: { message: 'Body temperature normal.', action: 'No action required.' },
      yellowLow: { message: 'Body temperature below normal.', action: 'Add a warm layer. Take a warm drink. Re-measure in 30 min.' },
      yellowHigh: { message: 'Mild fever.', action: 'Rest. Drink water. Limit contact with the crew. Re-measure in 2 h.' },
      redLow: { message: 'Body temperature dangerously low.', action: 'Warm up with layers and blankets now. Notify the crew medical officer (CMO).' },
      redHigh: { message: 'High fever.', action: 'Rest. Drink fluids. Cool down. Notify the crew medical officer (CMO) now.' },
    },
  },

  sleep: {
    label: 'Sleep',
    unit: 'h',
    hazards: ['I', 'E'],
    green: [6, 9.5], // TODO: verify + cite source
    yellow: [5, 11], // TODO: verify + cite source
    tightenStep: 0,
    baseline: { yellow: 2, red: 3.5, direction: 'low' }, // TODO: verify + cite source
    source: '',
    input: { min: 0, max: 24, step: 0.1 },
    text: {
      green: { message: 'Sleep sufficient.', action: 'No action required. Keep the same sleep time tonight.' },
      yellowLow: { message: 'Sleep below requirement.', action: 'No caffeine after midday. Dim lights 1 h before sleep. Protect tonight’s sleep period.' },
      yellowHigh: { message: 'Sleep longer than usual.', action: 'Monitor how you feel today. Long sleep can indicate illness or low mood.' },
      redLow: { message: 'Severe sleep deficit.', action: 'No high-risk tasks alone today. Report to the commander for a schedule change.' },
      redHigh: { message: 'Sleep far longer than usual.', action: 'Notify the crew medical officer (CMO). Re-check your other vitals today.' },
    },
  },

  mood: {
    label: 'Mood',
    unit: '/ 5',
    hazards: ['I'],
    green: [3, null], // TODO: verify + cite source
    yellow: [2, null], // TODO: verify + cite source
    tightenStep: 0,
    baseline: { yellow: 2, red: 3, direction: 'low' }, // TODO: verify + cite source
    source: '',
    input: { min: 1, max: 5, step: 1 },
    text: {
      green: { message: 'Mood stable.', action: 'No action required. Continue the daily check-in.' },
      yellowLow: { message: 'Mood below your usual level.', action: 'Take a break. Talk to a crewmate. View a message from home.' },
      yellowHigh: { message: 'Mood stable.', action: 'No action required.' },
      redLow: { message: 'Mood very low.', action: 'Do not keep this to yourself. Talk to the crew medical officer (CMO) today.' },
      redHigh: { message: 'Mood stable.', action: 'No action required.' },
    },
  },
}

// Order used on the dashboard, log form, charts and reports.
export const INDICATOR_ORDER = ['heartRate', 'bloodPressure', 'bloodSugar', 'temperature', 'sleep', 'mood']

// ---------- Cabin and radiation sensors (simulated) ----------
// Same range format as above. ALL PLACEHOLDERS: verify + cite source.

export const SENSOR_THRESHOLDS = {
  co2: {
    label: 'Cabin CO₂',
    unit: 'ppm',
    hazard: 'E',
    green: [null, 3500], // TODO: verify + cite source
    yellow: [null, 5300], // TODO: verify + cite source
    source: '',
    decimals: 0,
    actions: {
      yellow: 'Check the CO₂ scrubber. Move to a better-ventilated module.',
      red: 'Move the crew to another module now. Restore CO₂ removal.',
    },
  },
  temp: {
    label: 'Cabin temperature',
    unit: '°C',
    hazard: 'E',
    green: [20, 25], // TODO: verify + cite source
    yellow: [18, 27], // TODO: verify + cite source
    source: '',
    decimals: 1,
    actions: {
      yellow: 'Adjust thermal control. Re-check in 30 min.',
      red: 'Cabin temperature unsafe. Check thermal control now.',
    },
  },
  humidity: {
    label: 'Humidity',
    unit: '%',
    hazard: 'E',
    green: [30, 60], // TODO: verify + cite source
    yellow: [25, 70], // TODO: verify + cite source
    source: '',
    decimals: 0,
    actions: {
      yellow: 'Check humidity control.',
      red: 'Humidity far out of range. Check for leaks or dehumidifier failure.',
    },
  },
  noise: {
    label: 'Noise',
    unit: 'dBA',
    hazard: 'E',
    green: [null, 60], // TODO: verify + cite source
    yellow: [null, 72], // TODO: verify + cite source
    source: '',
    decimals: 0,
    actions: {
      yellow: 'Wear hearing protection. Locate the noise source.',
      red: 'Harmful noise level. Wear hearing protection. Leave the module.',
    },
  },
  radiation: {
    label: 'Radiation',
    unit: 'µSv/h',
    hazard: 'R',
    green: [null, 50], // TODO: verify + cite source
    yellow: [null, 200], // TODO: verify + cite source
    source: '',
    decimals: 0,
    actions: {
      yellow: 'Radiation rising. Avoid low-shielding areas. Prepare to shelter.',
      red: 'Solar storm. Proceed to the storm shelter now.',
    },
  },
}

export const SENSOR_ORDER = ['co2', 'temp', 'humidity', 'noise', 'radiation']
