// The four places the app can run. Changing environment changes the context text,
// the gravity level, the storm shelter advice and (through the comms delay) the response level.
// Delay numbers are computed in engine/responseLevel.js.

export const ENVIRONMENTS = {
  iss: {
    id: 'iss',
    name: 'Space station (low Earth orbit)',
    short: 'ISS',
    gravity: 0,
    gravityLabel: '0 g (weightless)',
    usesMissionDay: false,
    maxMissionDay: 780,
    context: 'You are in low Earth orbit. Ground support is a call away, so serious readings go straight to the flight surgeons.',
    shelter: 'Move to the most heavily shielded module and stay there until the all-clear.',
  },
  spacecraft: {
    id: 'spacecraft',
    name: 'Spacecraft (in transit)',
    short: 'Transit',
    gravity: 0,
    gravityLabel: '0 g (weightless)',
    usesMissionDay: true,
    maxMissionDay: 180,
    context: 'You are in transit and weightless. The delay to Earth grows every day, so the crew takes on more as the trip goes on.',
    shelter: 'Go to the storm shelter area and build up shielding with stowed supplies and water bags.',
  },
  moon: {
    id: 'moon',
    name: 'Moon base',
    short: 'Moon',
    gravity: 0.17,
    gravityLabel: '0.17 g (one-sixth of Earth)',
    usesMissionDay: false,
    maxMissionDay: 780,
    context: 'You are on the lunar surface in one-sixth of Earth gravity. Ground can still talk to you almost live.',
    shelter: 'Get back inside the habitat and move to the shielded shelter. If you are outside, end the spacewalk now.',
  },
  mars: {
    id: 'mars',
    name: 'Mars base',
    short: 'Mars',
    gravity: 0.38,
    gravityLabel: '0.38 g (about one-third of Earth)',
    usesMissionDay: true,
    maxMissionDay: 780,
    context: 'You are on Mars in about one-third of Earth gravity. Messages take minutes each way, so the crew acts first and reports after.',
    shelter: 'Get back inside the habitat and move to the shielded shelter. If you are outside, end the surface activity now.',
  },
}

export const ENVIRONMENT_ORDER = ['iss', 'spacecraft', 'moon', 'mars']
