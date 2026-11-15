import { useEffect, useRef, useState } from 'react'
import { estimateBpm } from '../engine/ppg.js'
import { BTN, BTN_PRIMARY, LABEL } from './ui.js'

// Camera heart-rate estimate. Video is read on this device only: nothing is saved or sent,
// and the camera stops when the measurement ends. Usage: <CameraHeartRate onUse={(bpm) => ...} />

const DURATION_MS = 20000
const W = 160
const H = 120
const ROI = { x: 56, y: 16, w: 48, h: 24 } // forehead box inside the analysis frame

export default function CameraHeartRate({ onUse }) {
  const [phase, setPhase] = useState('idle') // idle | measuring | done | error
  const [pct, setPct] = useState(0)
  const [result, setResult] = useState(null)
  const [message, setMessage] = useState('')
  const videoRef = useRef(null)
  const runRef = useRef(null)

  function stop() {
    const r = runRef.current
    if (!r) return
    r.canceled = true
    if (r.id) {
      if (r.vfc) r.video.cancelVideoFrameCallback(r.id)
      else cancelAnimationFrame(r.id)
    }
    r.stream.getTracks().forEach((t) => t.stop())
    r.video.srcObject = null
    runRef.current = null
  }

  useEffect(() => stop, [])

  function fail(e) {
    stop()
    const n = e && e.name
    setMessage(
      n === 'NotAllowedError'
        ? 'Camera access is blocked. Allow the camera in the browser, then retry.'
        : n === 'NotFoundError'
          ? 'No camera found on this device.'
          : 'Camera could not start.',
    )
    setPhase('error')
  }

  function finish(samples, light) {
    stop()
    const est = estimateBpm(samples)
    if (est && est.quality !== 'low') {
      setResult(est)
      setMessage('')
    } else {
      setResult(null)
      setMessage(light < 50 ? 'Too dark. Face a light and retry.' : 'Signal too weak. Sit still, face a light and retry.')
    }
    setPhase('done')
  }

  async function start() {
    setResult(null)
    setMessage('')
    setPct(0)
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMessage('Camera needs a secure page (localhost or https).')
      setPhase('error')
      return
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 320 }, height: { ideal: 240 } },
        audio: false,
      })
      const video = videoRef.current
      const r = { stream, video, id: 0, vfc: 'requestVideoFrameCallback' in video, canceled: false }
      runRef.current = r
      video.srcObject = stream
      await video.play()
      setPhase('measuring')

      const canvas = document.createElement('canvas')
      canvas.width = W
      canvas.height = H
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      const samples = []
      const t0 = performance.now()
      let lastPct = -1

      const tick = () => {
        if (r.canceled) return
        const now = performance.now()
        ctx.drawImage(video, 0, 0, W, H)
        const d = ctx.getImageData(ROI.x, ROI.y, ROI.w, ROI.h).data
        let g = 0
        let l = 0
        const n = d.length / 4
        for (let i = 0; i < d.length; i += 4) {
          g += d[i + 1]
          l += d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11
        }
        samples.push({ t: now, v: g / n })
        const p = Math.min(100, Math.floor(((now - t0) / DURATION_MS) * 100))
        if (p !== lastPct) {
          lastPct = p
          setPct(p)
        }
        if (p >= 100) {
          finish(samples, l / n)
          return
        }
        r.id = r.vfc ? video.requestVideoFrameCallback(tick) : requestAnimationFrame(tick)
      }
      r.id = r.vfc ? video.requestVideoFrameCallback(tick) : requestAnimationFrame(tick)
    } catch (e) {
      fail(e)
    }
  }

  const secondsLeft = Math.max(0, Math.ceil((DURATION_MS * (100 - pct)) / 100 / 1000))
  const primary = BTN_PRIMARY
  const secondary = BTN

  return (
    <section className="rounded border border-oc-border/70 bg-oc-bg/60 p-4 text-white" aria-label="Camera heart rate">
      <div className="flex items-center justify-between gap-2">
        <h3 className={LABEL}>Camera heart rate</h3>
        <span className="rounded-sm border border-oc-gray/60 px-1.5 py-0.5 text-xs font-semibold tracking-wider text-oc-gray">ESTIMATE</span>
      </div>

      <div className={phase === 'measuring' ? 'relative mx-auto mt-3 aspect-[4/3] w-full max-w-xs overflow-hidden rounded border border-oc-border/70' : 'pointer-events-none fixed left-0 top-0 h-px w-px opacity-0'}>
        <video ref={videoRef} playsInline muted className="h-full w-full object-cover" style={{ transform: 'scaleX(-1)' }} />
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-[35%] top-[13%] h-[20%] w-[30%] rounded-sm border border-oc-blue" />
          <div className="absolute left-[25%] top-[6%] h-[88%] w-[50%] rounded-[50%] border border-white/30" />
        </div>
      </div>

      {phase === 'idle' && (
        <div className="mt-3 space-y-3">
          <p>Face a light. Sit still for 20 seconds. Keep your forehead inside the box.</p>
          <p className="text-sm text-oc-gray">Video stays on this device. Nothing is saved or sent.</p>
          <button type="button" className={primary} onClick={start}>Start</button>
        </div>
      )}

      {phase === 'measuring' && (
        <div className="mt-3 space-y-3">
          <div className="h-1.5 w-full overflow-hidden rounded-sm bg-oc-panel">
            <div className="h-full bg-oc-blue" style={{ width: pct + '%' }} />
          </div>
          <p role="status">Hold still. {secondsLeft} s left.</p>
          <button type="button" className={secondary} onClick={() => { stop(); setPhase('idle') }}>Cancel</button>
        </div>
      )}

      {phase === 'done' && result && (
        <div className="mt-3 space-y-3">
          <p className="font-mono text-4xl font-medium">{result.bpm} <span className="text-base text-oc-gray">bpm</span></p>
          <p>Signal: {result.quality === 'good' ? 'Good' : 'Fair'}</p>
          <p className="text-sm text-oc-gray">Camera estimate. Confirm with a manual count before acting on a red result.</p>
          <div className="flex flex-wrap gap-2">
            <button type="button" className={primary} onClick={() => onUse && onUse(result.bpm)}>Use this value</button>
            <button type="button" className={secondary} onClick={start}>Measure again</button>
          </div>
        </div>
      )}

      {(phase === 'error' || (phase === 'done' && !result)) && (
        <div className="mt-3 space-y-3">
          <p role="status">{message || 'Camera needs a secure page (localhost or https).'}</p>
          <button type="button" className={secondary} onClick={start}>Try again</button>
        </div>
      )}
    </section>
  )
}
