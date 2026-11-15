// Emergency scenarios for Emergency mode.
//
// PLACEHOLDER CONTENT. These steps are simple first-aid style guidance written for the demo.
// They are NOT verified medical protocols. Before presenting, check each one against a real
// source (NASA / first-aid body), fix the wording, and fill in `source`.
//
// To add a scenario: copy one block, give it a new `id`, write 4-6 short steps.

export const EMERGENCIES = [
  {
    id: 'chestPain',
    title: 'Chest pain',
    summary: 'Pain, pressure or tightness in the chest.',
    hazards: ['G', 'D'],
    source: '', // TODO: verify + cite source
    steps: [
      'Stop all activity. Restrain the crew member in a comfortable position.',
      'Call the crew medical officer (CMO). Bring the medical kit and the defibrillator (AED).',
      'Measure heart rate and blood pressure. Log both.',
      'Loosen tight clothing. Keep the crew member calm, breathing slowly.',
      'If unresponsive and not breathing normally: start CPR. Use the AED as trained.',
      'Follow the onboard medical checklist for chest pain.',
    ],
  },
  {
    id: 'collapse',
    title: 'Fainting or collapse',
    summary: 'A crew member loses consciousness or cannot hold position.',
    hazards: ['G', 'E'],
    source: '', // TODO: verify + cite source
    steps: [
      'Check for a response: speak loudly, tap the shoulders.',
      'Check breathing. If not breathing normally: start CPR. Send for the AED.',
      'If breathing: restrain in a safe position. Keep the airway clear.',
      'Measure heart rate, blood pressure and blood sugar. Log all three.',
      'Check the Habitat panel for high CO₂ or other cabin alerts.',
      'Once awake: give water. Do not leave the crew member alone. Notify the crew medical officer (CMO).',
    ],
  },
  {
    id: 'highFever',
    title: 'High fever',
    summary: 'Temperature well above normal, with or without chills.',
    hazards: ['E', 'R'],
    source: '', // TODO: verify + cite source
    steps: [
      'Re-measure temperature to confirm. Log it.',
      'Rest and fluids. Remove extra layers.',
      'Limit contact with the rest of the crew.',
      'Rest of the crew: wipe down shared surfaces. Check your own temperature.',
      'Fever medication only as the onboard medical checklist directs. Notify the crew medical officer (CMO).',
      'Re-measure every hour. Log each reading.',
    ],
  },
  {
    id: 'panic',
    title: 'Panic attack',
    summary: 'Sudden fear, fast breathing, racing heart.',
    hazards: ['I'],
    source: '', // TODO: verify + cite source
    steps: [
      'Stay with the crew member. Speak slowly and calmly.',
      'Move to a quieter module if possible.',
      'Paced breathing together: in for 4 seconds, out for 6 seconds. Continue for several minutes.',
      'Grounding: name 5 things you can see and 3 things you can hear.',
      'When calmer: measure heart rate. Log it.',
      'If chest pain or breathing difficulty continues: switch to the Chest pain checklist.',
    ],
  },
  {
    id: 'radiationStorm',
    title: 'Radiation storm',
    summary: 'Solar storm alert or radiation reading in the red.',
    hazards: ['R'],
    source: '', // TODO: verify + cite source
    usesShelterAdvice: true, // step 1 is replaced by the shelter advice for the current environment
    steps: [
      'Proceed to the storm shelter now.',
      'Account for all crew. Everyone must be in the shelter.',
      'Bring water, food and the medical kit. Remain until radiation returns to green.',
      'Read each personal dosimeter. Record the values.',
      'Monitor for nausea, vomiting or unusual fatigue. Log any symptoms.',
    ],
  },
]
