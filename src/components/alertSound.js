// Short alert beep made with the Web Audio API (no audio files, works offline).
// Browsers only allow sound after the user has interacted with the page; until then this is silent.

let audioContext = null

export function playAlertBeep() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext
    if (!AudioCtx) return
    audioContext ??= new AudioCtx()
    if (audioContext.state === 'suspended') audioContext.resume()

    const start = audioContext.currentTime
    // Two quick high tones.
    for (const offset of [0, 0.22]) {
      const osc = audioContext.createOscillator()
      const gain = audioContext.createGain()
      osc.type = 'square'
      osc.frequency.value = 880
      gain.gain.setValueAtTime(0.0001, start + offset)
      gain.gain.exponentialRampToValueAtTime(0.15, start + offset + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.16)
      osc.connect(gain).connect(audioContext.destination)
      osc.start(start + offset)
      osc.stop(start + offset + 0.18)
    }
  } catch {
    // Sound is a nice-to-have. Never break the app over it.
  }
}
