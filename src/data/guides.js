// "How to measure" and "why it matters in space" for each indicator.
// Plain language on purpose: astronauts are not doctors.
// TODO: verify the space-specific claims against NASA Human Research Program material and add sources.

export const GUIDES = {
  heartRate: {
    need: 'Pulse oximeter (finger clip), or two fingers and a timer.',
    steps: [
      'Stay still for 5 min first.',
      'Clip the oximeter on a warm finger. Wait for a steady reading.',
      'No oximeter: press two fingers on the inside of the wrist. Count beats for 30 s. Multiply by 2.',
      'Enter the value in beats per minute (bpm).',
    ],
    spaceTip: 'Hook your feet under a restraint so your muscles are not working to hold position.',
    why: 'In microgravity the heart works less and can lose fitness. A resting rate that drifts up or down is an early sign of dehydration, illness or stress.',
    source: '',
  },
  bloodPressure: {
    need: 'Automatic upper-arm cuff.',
    steps: [
      'Rest 5 min. No exercise or caffeine in the last 30 min.',
      'Place the cuff on the bare upper arm, level with the heart.',
      'Stay still and quiet. Press start.',
      'Enter both values: top (systolic) and bottom (diastolic).',
    ],
    spaceTip: 'Restrain the arm on a surface so it does not float during the reading.',
    why: 'In microgravity, body fluid shifts toward the head and changes blood pressure. After landing, pressure can drop on standing and cause fainting.',
    source: '',
  },
  bloodSugar: {
    need: 'Glucometer, test strip, lancet, alcohol wipe.',
    steps: [
      'Clean the fingertip. Let it dry.',
      'Prick the side of the fingertip with the lancet.',
      'Touch the blood drop to the test strip.',
      'Enter the value in mg/dL.',
    ],
    spaceTip: 'In microgravity blood forms a floating drop. Bring the strip to the drop. Stow the lancet in the sharps container immediately.',
    why: 'Space food, stress and a shifted body clock all affect blood sugar. Values too low or too high reduce focus and energy.',
    source: '',
  },
  temperature: {
    need: 'Digital thermometer (forehead or ear).',
    steps: [
      'Wait 15 min after exercise, eating or drinking.',
      'Hold the thermometer to the forehead or ear as shown on the device.',
      'Wait for the beep.',
      'Enter the value.',
    ],
    spaceTip: 'In microgravity heat does not rise off the body, so you can feel warm without a fever. Use the thermometer reading.',
    why: 'The immune system is weaker in space and germs spread easily in a closed cabin. Fever is the first sign of infection.',
    source: '',
  },
  sleep: {
    need: 'Sleep time and wake time (or a sleep-tracking watch).',
    steps: [
      'Note the time you went to sleep.',
      'Note the time you woke up.',
      'Enter both. The app calculates the hours.',
    ],
    spaceTip: 'Use the sleep station with a mask and earplugs. The cabin is never fully dark or quiet.',
    why: 'In orbit the crew sees many sunrises a day, which disrupts the body clock. Poor sleep leads to errors, low mood and weaker immunity.',
    source: '',
  },
  mood: {
    need: 'One quiet minute. No device needed.',
    steps: [
      'Pause your current task.',
      'Rate overall mood from 1 (very low) to 5 (very good).',
      'Answer the three short questions: stress, energy, loneliness.',
      'Answer accurately. This is for your own monitoring, not a score.',
    ],
    spaceTip: 'Check in at the same time every day so the trend is reliable.',
    why: 'Months in a confined space, far from family, take a toll. A slow drop in mood is easier to address early.',
    source: '',
  },
}
