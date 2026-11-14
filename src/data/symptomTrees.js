// Decision trees for the Symptom Checker.
//
// PLACEHOLDER CONTENT: verify the medical logic before presenting.
//
// Each tree has a `start` node id and a map of `nodes`. Three node types:
//
//   { type: 'data', check: 'co2High', yes: 'nodeId', no: 'nodeId' }
//       Answered automatically from app data. `check` must be a key in
//       DATA_CHECKS (engine/symptomRunner.js). The user sees what was checked.
//
//   { type: 'question', text: 'Do you feel sick?', yes: 'nodeId', no: 'nodeId' }
//       Asked to the astronaut as a Yes / No question.
//
//   { type: 'result', hazards: ['E'], level: 'yellow', title: '...', actions: ['...'], escalate: false }
//       The end of a path. hazards = RIDGE letters. level = green | yellow | red.
//       If escalate is true, the app adds the escalation instruction for the current response level.
//
// To add a symptom: add a new key below. No component changes needed.

export const SYMPTOM_TREES = {
  headache: {
    label: 'Headache',
    start: 'co2',
    nodes: {
      co2: { type: 'data', check: 'co2High', yes: 'resultCo2', no: 'storm' },
      storm: { type: 'data', check: 'stormLast24h', yes: 'nausea', no: 'gravity' },
      nausea: { type: 'question', text: 'Do you also feel sick to your stomach?', yes: 'resultRadiation', no: 'gravity' },
      gravity: { type: 'data', check: 'gravityChanged3d', yes: 'fluid', no: 'sleepMood' },
      fluid: { type: 'question', text: 'Is your face puffy, or is your vision blurry?', yes: 'resultFluid', no: 'sleepMood' },
      sleepMood: { type: 'data', check: 'poorSleepOrLowMood', yes: 'resultIsolation', no: 'resultUnknown' },

      resultCo2: {
        type: 'result',
        hazards: ['E'],
        level: 'yellow',
        title: 'Likely cause: high CO₂ in the cabin',
        actions: [
          'Move to a better-ventilated module.',
          'Check the air scrubber.',
          'Check again in 1 hour. If the headache is worse, run the checker again.',
        ],
        escalate: false,
      },
      resultRadiation: {
        type: 'result',
        hazards: ['R'],
        level: 'red',
        title: 'Possible radiation exposure',
        actions: [
          'Go to the storm shelter if the storm is still active.',
          'Check your personal dosimeter and note the reading.',
          'Log every symptom, including nausea and tiredness.',
        ],
        escalate: true,
      },
      resultFluid: {
        type: 'result',
        hazards: ['G'],
        level: 'yellow',
        title: 'Likely cause: body fluid shifting toward your head',
        actions: [
          'This is common in the first days of a new gravity level.',
          'Log it, and do a vision check (read the eye chart at the set distance).',
          'Tell the crew medical officer if your vision keeps getting worse.',
        ],
        escalate: false,
      },
      resultIsolation: {
        type: 'result',
        hazards: ['I'],
        level: 'yellow',
        title: 'Likely cause: poor sleep or low mood',
        actions: [
          'Rest now if the schedule allows, and protect tonight’s sleep.',
          'Drink water and skip caffeine for the rest of the day.',
          'Talk to a crewmate, and open the memory bank for a message from home.',
        ],
        escalate: false,
      },
      resultUnknown: {
        type: 'result',
        hazards: [],
        level: 'yellow',
        title: 'No clear cause found',
        actions: [
          'Drink water and rest for 20 minutes.',
          'Measure your vitals again and log them.',
          'If the headache is still bad in 2 hours, tell the crew medical officer.',
        ],
        escalate: false,
      },
    },
  },

  // ---------- STUB TREES below: TODO expand to 4-6 nodes each ----------

  dizziness: {
    label: 'Dizziness',
    start: 'gravity',
    nodes: {
      // TODO: add blood pressure check, blood sugar check, CO₂ check
      gravity: { type: 'data', check: 'gravityChanged3d', yes: 'resultGravity', no: 'standing' },
      standing: { type: 'question', text: 'Does it get worse when you stand up or change position quickly?', yes: 'resultPressure', no: 'resultUnknown' },
      resultGravity: {
        type: 'result',
        hazards: ['G'],
        level: 'yellow',
        title: 'Likely cause: adapting to a new gravity level',
        actions: ['Move your head slowly.', 'Avoid driving or tricky tasks today.', 'Log it. This should ease within a few days.'],
        escalate: false,
      },
      resultPressure: {
        type: 'result',
        hazards: ['G'],
        level: 'yellow',
        title: 'Possible blood pressure drop',
        actions: ['Sit or lie down.', 'Drink water.', 'Measure your blood pressure and log it.'],
        escalate: false,
      },
      resultUnknown: {
        type: 'result',
        hazards: [],
        level: 'yellow',
        title: 'No clear cause found',
        actions: ['Rest and drink water.', 'Measure your vitals and log them.', 'Tell the crew medical officer if it continues.'],
        escalate: false,
      },
    },
  },

  nausea: {
    label: 'Nausea',
    start: 'storm',
    nodes: {
      // TODO: add fever check (illness), food question, CO₂ check
      storm: { type: 'data', check: 'stormLast24h', yes: 'resultRadiation', no: 'gravity' },
      gravity: { type: 'data', check: 'gravityChanged3d', yes: 'resultMotion', no: 'resultUnknown' },
      resultRadiation: {
        type: 'result',
        hazards: ['R'],
        level: 'red',
        title: 'Possible radiation exposure',
        actions: ['Go to the storm shelter if the storm is still active.', 'Check your dosimeter.', 'Log every symptom.'],
        escalate: true,
      },
      resultMotion: {
        type: 'result',
        hazards: ['G'],
        level: 'yellow',
        title: 'Likely cause: space motion sickness',
        actions: ['Keep your head still and look at a fixed point.', 'Eat small, plain meals.', 'Log it. This should ease within a few days.'],
        escalate: false,
      },
      resultUnknown: {
        type: 'result',
        hazards: [],
        level: 'yellow',
        title: 'No clear cause found',
        actions: ['Sip water.', 'Measure your temperature and log it.', 'Tell the crew medical officer if it continues.'],
        escalate: false,
      },
    },
  },

  fatigue: {
    label: 'Fatigue',
    start: 'sleep',
    nodes: {
      // TODO: add CO₂ check, fever check, exercise / nutrition questions
      sleep: { type: 'data', check: 'sleepUnder6', yes: 'resultSleep', no: 'co2' },
      co2: { type: 'data', check: 'co2High', yes: 'resultCo2', no: 'resultUnknown' },
      resultSleep: {
        type: 'result',
        hazards: ['I', 'E'],
        level: 'yellow',
        title: 'Likely cause: not enough sleep',
        actions: ['Take a short nap if the schedule allows.', 'No caffeine after midday.', 'Keep a fixed bedtime tonight.'],
        escalate: false,
      },
      resultCo2: {
        type: 'result',
        hazards: ['E'],
        level: 'yellow',
        title: 'Likely cause: high CO₂ in the cabin',
        actions: ['Move to a better-ventilated module.', 'Check the air scrubber.', 'Check again in 1 hour.'],
        escalate: false,
      },
      resultUnknown: {
        type: 'result',
        hazards: [],
        level: 'yellow',
        title: 'No clear cause found',
        actions: ['Eat and drink something.', 'Measure your vitals and log them.', 'Tell the crew medical officer if it lasts more than 2 days.'],
        escalate: false,
      },
    },
  },

  lowMood: {
    label: 'Low mood',
    start: 'moodTrend',
    nodes: {
      // TODO: add sleep check, workload question, safety question with red result
      moodTrend: { type: 'data', check: 'lowMood3d', yes: 'resultOngoing', no: 'resultRecent' },
      resultOngoing: {
        type: 'result',
        hazards: ['I'],
        level: 'yellow',
        title: 'Your mood has been low for several days',
        actions: ['Talk to a crewmate you trust today.', 'Open the memory bank for a message from home.', 'Ask for a private call with ground support.'],
        escalate: false,
      },
      resultRecent: {
        type: 'result',
        hazards: ['I'],
        level: 'green',
        title: 'A low day, not a trend yet',
        actions: ['Take a real break.', 'Exercise, eat well and protect tonight’s sleep.', 'Do your mood check-in again tomorrow.'],
        escalate: false,
      },
    },
  },
}
