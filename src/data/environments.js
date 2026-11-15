// The four places the app can run. Changing environment changes the context text,
// the gravity level, the storm shelter advice and (through the comms delay) the response level.
// shelter = full instruction (shelter steps); shelterName = short label (Radiation page shelter card).
// Delay numbers are computed in engine/responseLevel.js.

export const ENVIRONMENTS = {
  iss: {
    id: 'iss',
    name: 'Space station (low Earth orbit)',
    short: 'ISS',
    gravity: 0,
    gravityLabel: '0 g (microgravity)',
    usesMissionDay: false,
    maxMissionDay: 780,
    context: 'Low Earth orbit. Ground link near real-time. Serious readings go straight to the flight surgeons.',
    shelter: 'Move to the most-shielded module. Remain there until the all-clear.',
    shelterName: 'Most-shielded module',
  },
  spacecraft: {
    id: 'spacecraft',
    name: 'Spacecraft (in transit)',
    short: 'Transit',
    gravity: 0,
    gravityLabel: '0 g (microgravity)',
    usesMissionDay: true,
    maxMissionDay: 180,
    context: 'In transit, microgravity. Delay to Earth increases daily. The crew takes on more decisions as the mission continues.',
    shelter: 'Proceed to the storm shelter. Add shielding with stowage and water bags. Remain there until the all-clear.',
    shelterName: 'Storm shelter (stowage and water bags)',
  },
  moon: {
    id: 'moon',
    name: 'Moon base',
    short: 'Moon',
    gravity: 0.17,
    gravityLabel: '0.17 g (one-sixth of Earth)',
    usesMissionDay: false,
    maxMissionDay: 780,
    context: 'Lunar surface, one-sixth Earth gravity. Ground link near real-time.',
    shelter: 'Return to the habitat and enter the storm shelter. Terminate any EVA now.',
    shelterName: 'Habitat storm shelter',
  },
  mars: {
    id: 'mars',
    name: 'Mars base',
    short: 'Mars',
    gravity: 0.38,
    gravityLabel: '0.38 g (about one-third of Earth)',
    usesMissionDay: true,
    maxMissionDay: 780,
    context: 'Mars surface, about one-third Earth gravity. Messages take minutes each way. The crew acts first and reports after.',
    shelter: 'Return to the habitat and enter the storm shelter. Terminate any EVA now.',
    shelterName: 'Habitat storm shelter',
  },
}

export const ENVIRONMENT_ORDER = ['iss', 'spacecraft', 'moon', 'mars']
