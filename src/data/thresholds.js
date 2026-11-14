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
      green: { message: 'Your resting heart rate is normal for you.', action: 'No action needed. Keep up your regular checks.' },
      yellowLow: { message: 'Your heart rate is lower than usual for you.', action: 'Rest for 10 minutes, then measure again. Note any dizziness.' },
      yellowHigh: { message: 'Your heart rate is higher than usual for you.', action: 'Sit still, breathe slowly for 10 minutes, drink water, then measure again.' },
      redLow: { message: 'Your heart rate is far below a safe resting level.', action: 'Stop what you are doing, stay restrained and tell a crewmate now.' },
      redHigh: { message: 'Your heart rate is far above a safe resting level.', action: 'Stop all activity, stay still and tell a crewmate now.' },
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
      green: { message: 'Your blood pressure is normal for you.', action: 'No action needed. Keep up your regular checks.' },
      yellowLow: { message: 'Your blood pressure is lower than usual for you.', action: 'Drink water, move slowly when you change position, and measure again in 30 minutes.' },
      yellowHigh: { message: 'Your blood pressure is higher than usual for you.', action: 'Rest quietly for 15 minutes, skip caffeine and salty food, then measure again.' },
      redLow: { message: 'Your blood pressure is dangerously low.', action: 'Lie flat or stay restrained, do not move around alone, and tell a crewmate now.' },
      redHigh: { message: 'Your blood pressure is dangerously high.', action: 'Stop all activity, rest, and tell a crewmate now. Watch for chest pain, bad headache or vision changes.' },
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
      green: { message: 'Your blood sugar is in the normal range.', action: 'No action needed. Eat your planned meals on schedule.' },
      yellowLow: { message: 'Your blood sugar is a little low.', action: 'Eat or drink something with sugar now, then measure again in 15 minutes.' },
      yellowHigh: { message: 'Your blood sugar is a little high.', action: 'Drink water, note what you ate, and measure again before your next meal.' },
      redLow: { message: 'Your blood sugar is dangerously low.', action: 'Take fast sugar (juice or glucose) right away and tell a crewmate now.' },
      redHigh: { message: 'Your blood sugar is dangerously high.', action: 'Drink water, do not exercise, and tell a crewmate now.' },
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
      green: { message: 'Your temperature is normal.', action: 'No action needed.' },
      yellowLow: { message: 'Your temperature is a little low.', action: 'Put on a warm layer, have a warm drink, and measure again in 30 minutes.' },
      yellowHigh: { message: 'You have a mild fever.', action: 'Rest, drink water, keep your distance from crewmates, and measure again in 2 hours.' },
      redLow: { message: 'Your temperature is dangerously low.', action: 'Warm up with layers and blankets now and tell a crewmate.' },
      redHigh: { message: 'You have a high fever.', action: 'Rest, drink fluids, cool down, and tell a crewmate now.' },
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
      green: { message: 'You got enough sleep.', action: 'No action needed. Keep the same bedtime tonight.' },
      yellowLow: { message: 'You slept less than you need.', action: 'Skip caffeine after midday, dim the lights an hour before bed, and protect tonight’s sleep.' },
      yellowHigh: { message: 'You slept more than usual.', action: 'Check how you feel today. Long sleep can be a sign of illness or low mood.' },
      redLow: { message: 'You are badly short on sleep.', action: 'Do not do risky tasks alone today. Tell the commander so your schedule can be adjusted.' },
      redHigh: { message: 'You slept far more than usual.', action: 'Tell a crewmate and check your other vitals today.' },
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
      green: { message: 'Your mood is steady.', action: 'No action needed. Keep doing your daily check-in.' },
      yellowLow: { message: 'Your mood is lower than usual.', action: 'Take a break, talk to a crewmate, and look at a message from home.' },
      yellowHigh: { message: 'Your mood is steady.', action: 'No action needed.' },
      redLow: { message: 'Your mood is very low.', action: 'Do not keep this to yourself. Talk to a crewmate you trust today.' },
      redHigh: { message: 'Your mood is steady.', action: 'No action needed.' },
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
      yellow: 'Check the air scrubber and move to a better-ventilated module.',
      red: 'Move the crew to another module now and fix the CO₂ removal system.',
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
      yellow: 'Adjust the thermal control setting and check again in 30 minutes.',
      red: 'Cabin temperature is unsafe. Check thermal control now.',
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
      yellow: 'Check the humidity control system.',
      red: 'Humidity is far out of range. Check for leaks or a failed dehumidifier.',
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
      yellow: 'Wear hearing protection in this module and find the noisy equipment.',
      red: 'Noise is at a harmful level. Wear hearing protection and leave the module.',
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
      yellow: 'Radiation is rising. Stay away from thin-walled areas and be ready to shelter.',
      red: 'Solar storm. Go to the storm shelter now.',
    },
  },
}

export const SENSOR_ORDER = ['co2', 'temp', 'humidity', 'noise', 'radiation']
