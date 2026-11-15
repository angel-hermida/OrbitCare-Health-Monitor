// Shared Tailwind class strings, so every screen looks the same.
// Colors come from the OrbitCare palette in src/index.css (oc-bg, oc-panel, oc-border, oc-gray,
// oc-blue, oc-red, oc-green, oc-yellow, oc-alert). See design/style-guide.webp.
// Tailwind only keeps classes it can find written out in full, so do not build these with string math.
// Green / yellow / red are for health status and the EMERGENCY button only.

// Panels: plain 1px border, 4px corners.
export const CARD = 'rounded border border-oc-border/70 bg-oc-panel/25 p-5'

// Buttons (style guide section 6).
const BTN_BASE = 'inline-flex items-center justify-center gap-2 rounded px-5 py-2.5 text-sm font-bold uppercase tracking-wider cursor-pointer transition-colors'
export const BTN_PRIMARY = `${BTN_BASE} bg-oc-blue text-white hover:bg-oc-blue/85`
export const BTN = `${BTN_BASE} bg-white text-oc-bg hover:bg-oc-gray` // secondary
export const BTN_OUTLINE = `${BTN_BASE} border-2 border-white text-white hover:bg-white/10`
export const BTN_DANGER = `${BTN_BASE} bg-oc-alert text-white hover:bg-oc-alert/85`

export const INPUT = 'w-full rounded border border-oc-border bg-oc-bg px-3 py-2 font-mono text-lg text-white placeholder:text-oc-gray/60 focus:border-oc-blue focus:outline-none'

// Typography (style guide section 2).
export const H1 = 'text-3xl font-bold text-white'
export const H2 = 'text-lg font-bold text-white'
export const LABEL = 'text-xs font-semibold uppercase tracking-[0.2em] text-oc-gray' // e.g. CREW MEMBER
export const MONO = 'font-mono' // large numbers (DM Mono)
export const MUTED = 'text-oc-gray'

// Data table (style guide section 8).
export const TABLE = 'w-full overflow-hidden rounded border border-oc-border/70 text-left'
export const TH = 'bg-oc-gray px-4 py-2.5 text-xs font-bold uppercase tracking-[0.15em] text-oc-bg'
export const TD = 'border-t border-oc-border/40 px-4 py-3 text-white'

// Status colors. Each level also has a word, so color is never the only signal.
export const STATUS = {
  green: { word: 'OK', text: 'text-oc-green', border: 'border-oc-green/60', bg: 'bg-oc-green/10', solid: 'bg-oc-green text-white', ring: '' },
  yellow: { word: 'CAUTION', text: 'text-oc-yellow', border: 'border-oc-yellow/70', bg: 'bg-oc-yellow/10', solid: 'bg-oc-yellow text-oc-bg', ring: 'ring-4 ring-oc-yellow' },
  red: { word: 'ALERT', text: 'text-oc-alert', border: 'border-oc-alert/80', bg: 'bg-oc-alert/10', solid: 'bg-oc-alert text-white', ring: 'ring-4 ring-oc-alert' },
  none: { word: 'NO DATA', text: 'text-oc-gray', border: 'border-oc-border/70', bg: 'bg-oc-panel/25', solid: 'bg-oc-gray text-oc-bg', ring: '' },
}

// Response level badges (keyed by RESPONSE_LEVELS id). Blue only: these are not health status.
export const LEVEL_BADGE = {
  ground: 'border-oc-blue text-oc-blue bg-transparent',
  shared: 'border-oc-blue text-oc-blue bg-transparent',
  crew: 'border-oc-blue text-white bg-oc-blue/25',
  autonomous: 'border-oc-blue text-white bg-oc-blue',
}
