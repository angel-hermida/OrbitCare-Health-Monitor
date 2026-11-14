// Simulated cabin and radiation sensors. One loop in MissionContext calls stepSensors().
// Values drift slowly around a target. Two demo switches move the targets:
//   stormActive -> radiation climbs into the red
//   co2Spike    -> cabin CO₂ climbs above its limit
// Later, swap this file for real sensor input without touching the UI.

export const SENSOR_TICK_MS = 2000

export const INITIAL_SENSORS = {
  co2: 2600, // ppm
  temp: 22.5, // °C
  humidity: 45, // %
  noise: 55, // dBA
  radiation: 20, // µSv/h
  stormActive: false,
  co2Spike: false,
}

// Move part of the way toward the target, plus a little random noise.
function drift(value, target, pull, jitter) {
  return value + (target - value) * pull + (Math.random() - 0.5) * 2 * jitter
}

export function stepSensors(s) {
  return {
    ...s,
    co2: drift(s.co2, s.co2Spike ? 4600 : 2600, 0.25, 40),
    temp: drift(s.temp, 22.5, 0.2, 0.1),
    humidity: drift(s.humidity, 45, 0.2, 0.8),
    noise: drift(s.noise, 55, 0.3, 1),
    radiation: Math.max(0, drift(s.radiation, s.stormActive ? 900 : 20, 0.35, s.stormActive ? 30 : 2)),
  }
}
