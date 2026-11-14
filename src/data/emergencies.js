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
      'Stop all activity. Help the person rest in a comfortable position and secure them so they do not drift.',
      'Call the crew medical officer and bring the medical kit and the defibrillator (AED).',
      'Measure heart rate and blood pressure and log them in this app.',
      'Loosen tight clothing. Keep the person calm and breathing slowly.',
      'If the person stops responding and is not breathing normally, start CPR and use the AED as trained.',
      'Follow the onboard medical checklist for chest pain.',
    ],
  },
  {
    id: 'collapse',
    title: 'Fainting or collapse',
    summary: 'A crew member passes out or cannot stay upright.',
    hazards: ['G', 'E'],
    source: '', // TODO: verify + cite source
    steps: [
      'Check for a response: speak loudly and tap the shoulders.',
      'Check for normal breathing. If there is none, start CPR and send someone for the AED.',
      'If breathing, secure the person in a safe position and keep the airway clear.',
      'Measure heart rate, blood pressure and blood sugar and log them.',
      'Check the Habitat panel for high CO₂ or other cabin alerts.',
      'When awake, give water and do not leave the person alone.',
    ],
  },
  {
    id: 'highFever',
    title: 'High fever',
    summary: 'Temperature well above normal, with or without chills.',
    hazards: ['E', 'R'],
    source: '', // TODO: verify + cite source
    steps: [
      'Measure temperature again to confirm and log it.',
      'Have the person rest and drink fluids. Remove extra layers.',
      'Keep the person away from the rest of the crew as much as possible.',
      'The rest of the crew: wipe shared surfaces and check your own temperature.',
      'Use fever medicine only as the onboard medical checklist says.',
      'Measure again every hour and log each reading.',
    ],
  },
  {
    id: 'panic',
    title: 'Panic attack',
    summary: 'Sudden fear, fast breathing, racing heart.',
    hazards: ['I'],
    source: '', // TODO: verify + cite source
    steps: [
      'Stay with the person. Speak slowly and calmly.',
      'Move to a quieter, less crowded spot if you can.',
      'Breathe together: in for 4 seconds, out for 6 seconds. Keep going for a few minutes.',
      'Ask them to name 5 things they can see and 3 things they can hear.',
      'When calmer, measure heart rate and log it.',
      'If chest pain or trouble breathing continues, switch to the Chest pain steps.',
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
      'Go to the storm shelter now.',
      'Count the crew. Everyone must be in the shelter.',
      'Bring water, food and the medical kit. Stay until the radiation reading is back in the green.',
      'Check each personal dosimeter and note the readings.',
      'Watch for nausea, vomiting or unusual tiredness and log any symptoms.',
    ],
  },
]
