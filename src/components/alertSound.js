// Alarm sounds made with the Web Audio API (no audio files, works offline).
// Browsers only allow sound after the user has interacted with the page; until then this is silent.
// Used by the Master Alarm (components/MasterAlarm.jsx) and the Settings preview.

let audioContext = null

function context() {
  const AudioCtx = window.AudioContext || window.webkitAudioContext
  if (!AudioCtx) return null
  audioContext ??= new AudioCtx()
  if (audioContext.state === 'suspended') audioContext.resume()
  return audioContext
}

// One short tone. offset / length in seconds from now.
function tone(ctx, frequency, offset, length = 0.16, volume = 0.14) {
  const start = ctx.currentTime + offset
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'square'
  osc.frequency.value = frequency
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(volume, start + 0.02)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + length)
  osc.connect(gain).connect(ctx.destination)
  osc.start(start)
  osc.stop(start + length + 0.02)
}

function safely(play) {
  try {
    const ctx = context()
    if (ctx) play(ctx)
  } catch {
    // Sound is a nice-to-have. Never break the app over it.
  }
}

// Master alarm: one two-tone pattern (high, low). Repeated every 2 s by MasterAlarm.jsx.
export function playAlarmPattern() {
  safely((ctx) => {
    tone(ctx, 960, 0, 0.18)
    tone(ctx, 720, 0.24, 0.18)
  })
}

// Emergency mode opened: three rising beeps before the repeating alarm.
export function playRisingBeeps() {
  safely((ctx) => {
    tone(ctx, 660, 0, 0.14)
    tone(ctx, 880, 0.2, 0.14)
    tone(ctx, 1100, 0.4, 0.18)
  })
}
