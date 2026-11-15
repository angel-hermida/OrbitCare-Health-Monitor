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
      nausea: { type: 'question', text: 'Do you also have nausea?', yes: 'resultRadiation', no: 'gravity' },
      gravity: { type: 'data', check: 'gravityChanged3d', yes: 'fluid', no: 'sleepMood' },
      fluid: { type: 'question', text: 'Facial puffiness or blurred vision?', yes: 'resultFluid', no: 'sleepMood' },
      sleepMood: { type: 'data', check: 'poorSleepOrLowMood', yes: 'resultIsolation', no: 'resultUnknown' },

      resultCo2: {
        type: 'result',
        hazards: ['E'],
        level: 'yellow',
        title: 'Likely cause: high cabin CO₂',
        actions: [
          'Move to a better-ventilated module.',
          'Check the CO₂ scrubber.',
          'Re-check in 1 h. If the headache worsens, rerun the symptom checker.',
        ],
        escalate: false,
      },
      resultRadiation: {
        type: 'result',
        hazards: ['R'],
        level: 'red',
        title: 'Possible radiation exposure',
        actions: [
          'Proceed to the storm shelter if the storm is ongoing.',
          'Read your personal dosimeter. Record the value.',
          'Log all symptoms, including nausea and fatigue.',
        ],
        escalate: true,
      },
      resultFluid: {
        type: 'result',
        hazards: ['G'],
        level: 'yellow',
        title: 'Likely cause: fluid shift toward the head',
        actions: [
          'Common in the first days at a new gravity level.',
          'Log it. Do a vision check (eye chart at the set distance).',
          'Report worsening vision to the crew medical officer (CMO).',
        ],
        escalate: false,
      },
      resultIsolation: {
        type: 'result',
        hazards: ['I'],
        level: 'yellow',
        title: 'Likely cause: poor sleep or low mood',
        actions: [
          'Rest now if the schedule allows. Protect tonight’s sleep period.',
          'Drink water. No caffeine for the rest of the day.',
          'Talk to a crewmate. View a message from home.',
        ],
        escalate: false,
      },
      resultUnknown: {
        type: 'result',
        hazards: [],
        level: 'yellow',
        title: 'No clear cause found',
        actions: [
          'Drink water. Rest 20 min.',
          'Re-measure vitals. Log them.',
          'If the headache persists after 2 h, notify the crew medical officer (CMO).',
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
      standing: { type: 'question', text: 'Worse when you change position quickly?', yes: 'resultPressure', no: 'resultUnknown' },
      resultGravity: {
        type: 'result',
        hazards: ['G'],
        level: 'yellow',
        title: 'Likely cause: adapting to a new gravity level',
        actions: ['Move your head slowly.', 'No rover operations or complex tasks today.', 'Log it. Symptoms should ease within a few days.'],
        escalate: false,
      },
      resultPressure: {
        type: 'result',
        hazards: ['G'],
        level: 'yellow',
        title: 'Possible blood pressure drop',
        actions: ['Stay restrained.', 'Drink water.', 'Measure blood pressure. Log it.'],
        escalate: false,
      },
      resultUnknown: {
        type: 'result',
        hazards: [],
        level: 'yellow',
        title: 'No clear cause found',
        actions: ['Rest. Drink water.', 'Measure vitals. Log them.', 'If it continues, notify the crew medical officer (CMO).'],
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
        actions: ['Proceed to the storm shelter if the storm is ongoing.', 'Read your personal dosimeter.', 'Log all symptoms.'],
        escalate: true,
      },
      resultMotion: {
        type: 'result',
        hazards: ['G'],
        level: 'yellow',
        title: 'Likely cause: space motion sickness',
        actions: ['Keep your head still. Fix your eyes on one point.', 'Small, plain meals only.', 'Log it. Symptoms should ease within a few days.'],
        escalate: false,
      },
      resultUnknown: {
        type: 'result',
        hazards: [],
        level: 'yellow',
        title: 'No clear cause found',
        actions: ['Small sips of water.', 'Measure temperature. Log it.', 'If it continues, notify the crew medical officer (CMO).'],
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
        title: 'Likely cause: sleep deficit',
        actions: ['Short nap if the schedule allows.', 'No caffeine after midday.', 'Keep a fixed sleep time tonight.'],
        escalate: false,
      },
      resultCo2: {
        type: 'result',
        hazards: ['E'],
        level: 'yellow',
        title: 'Likely cause: high cabin CO₂',
        actions: ['Move to a better-ventilated module.', 'Check the CO₂ scrubber.', 'Re-check in 1 h.'],
        escalate: false,
      },
      resultUnknown: {
        type: 'result',
        hazards: [],
        level: 'yellow',
        title: 'No clear cause found',
        actions: ['Eat and drink.', 'Measure vitals. Log them.', 'If it lasts more than 2 days, notify the crew medical officer (CMO).'],
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
        title: 'Mood low for several days',
        actions: ['Talk to a crewmate you trust today.', 'View a message from home.', 'Request a private conference with ground support. Notify the crew medical officer (CMO).'],
        escalate: false,
      },
      resultRecent: {
        type: 'result',
        hazards: ['I'],
        level: 'green',
        title: 'A low day, not yet a trend',
        actions: ['Take a scheduled break.', 'Exercise. Eat well. Protect tonight’s sleep period.', 'Repeat the mood check-in tomorrow.'],
        escalate: false,
      },
    },
  },
}
