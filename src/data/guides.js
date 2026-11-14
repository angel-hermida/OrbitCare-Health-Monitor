// "How to measure" and "why it matters in space" for each indicator.
// Plain language on purpose: astronauts are not doctors.
// TODO: verify the space-specific claims against NASA Human Research Program material and add sources.

export const GUIDES = {
  heartRate: {
    need: 'Pulse oximeter (finger clip), or two fingers and a clock.',
    steps: [
      'Sit or float still for 5 minutes first.',
      'Clip the oximeter on a warm finger and wait for a steady number.',
      'No oximeter? Press two fingers on the inside of your wrist, count beats for 30 seconds, then double it.',
      'Enter the number in beats per minute (bpm).',
    ],
    spaceTip: 'Hook your feet under a restraint so you are not using muscles to hold your position.',
    why: 'In weightlessness your heart does less work and can lose fitness. A resting rate that drifts up or down is an early sign of dehydration, illness or stress.',
    source: '',
  },
  bloodPressure: {
    need: 'Automatic upper-arm cuff.',
    steps: [
      'Rest for 5 minutes. No exercise or caffeine in the last 30 minutes.',
      'Wrap the cuff around your bare upper arm, level with your heart.',
      'Stay still and quiet, then press start.',
      'Enter both numbers: top (systolic) and bottom (diastolic).',
    ],
    spaceTip: 'Rest your arm on a surface or strap it down so it does not float during the reading.',
    why: 'Body fluid shifts toward your head in weightlessness, which changes blood pressure. After landing, pressure can drop when you stand and make you faint.',
    source: '',
  },
  bloodSugar: {
    need: 'Glucometer, test strip, lancet, alcohol wipe.',
    steps: [
      'Clean your fingertip and let it dry.',
      'Prick the side of your fingertip with the lancet.',
      'Touch the drop of blood to the test strip.',
      'Enter the number in mg/dL.',
    ],
    spaceTip: 'Blood forms a floating ball in weightlessness. Bring the strip to the drop, and stow the lancet in the sharps container right away.',
    why: 'Space food, stress and a shifted body clock all affect blood sugar. Readings that are too low or too high hurt your focus and energy.',
    source: '',
  },
  temperature: {
    need: 'Digital thermometer (forehead or ear).',
    steps: [
      'Wait 15 minutes after exercise, eating or drinking.',
      'Hold the thermometer on your forehead or in your ear as shown on the device.',
      'Wait for the beep.',
      'Enter the number.',
    ],
    spaceTip: 'Heat does not rise off your body in weightlessness, so you can feel warm without having a fever. Trust the thermometer, not the feeling.',
    why: 'Your immune system is weaker in space and germs spread easily in a closed cabin. A fever is the first sign that you may be getting sick.',
    source: '',
  },
  sleep: {
    need: 'Your bedtime and wake time (or a sleep-tracking watch).',
    steps: [
      'Note the time you went to sleep.',
      'Note the time you woke up.',
      'Enter both. The app works out the hours.',
    ],
    spaceTip: 'Zip into your sleep station and use a mask and earplugs. The cabin is never fully dark or quiet.',
    why: 'In orbit you see many sunrises a day, which confuses your body clock. Poor sleep leads to mistakes, low mood and a weaker immune system.',
    source: '',
  },
  mood: {
    need: 'One quiet minute. No device.',
    steps: [
      'Stop what you are doing.',
      'Rate your overall mood from 1 (very low) to 5 (very good).',
      'Answer the three quick questions about stress, energy and loneliness.',
      'Be honest. This is for you, not for a score.',
    ],
    spaceTip: 'Do it at the same time every day so the trend means something.',
    why: 'Months in a small space, far from family, wear people down. Catching a slow drop in mood early is much easier than fixing it late.',
    source: '',
  },
}
