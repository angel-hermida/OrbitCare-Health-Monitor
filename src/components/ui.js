// Shared Tailwind class strings, so every screen looks the same.
// Tailwind only keeps classes it can find written out in full, so do not build these with string math.

export const CARD = 'rounded-xl border border-slate-800 bg-slate-900 p-5'
export const BTN = 'inline-flex items-center justify-center rounded-lg border border-slate-700 bg-slate-800 px-4 py-2 font-medium text-slate-100 hover:bg-slate-700 cursor-pointer'
export const BTN_PRIMARY = 'inline-flex items-center justify-center rounded-lg bg-sky-500 px-4 py-2 font-semibold text-slate-950 hover:bg-sky-400 cursor-pointer'
export const BTN_DANGER = 'inline-flex items-center justify-center rounded-lg bg-red-600 px-4 py-2 font-bold text-white hover:bg-red-500 cursor-pointer'
export const INPUT = 'w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-lg text-slate-100 focus:border-sky-400 focus:outline-none'
export const H1 = 'text-2xl font-bold text-white'
export const H2 = 'text-lg font-semibold text-white'
export const MUTED = 'text-slate-400'

// Status colors. Each level also has a word, so color is never the only signal.
export const STATUS = {
  green: { word: 'OK', text: 'text-emerald-400', border: 'border-emerald-500/50', bg: 'bg-emerald-500/10', solid: 'bg-emerald-400 text-slate-950' },
  yellow: { word: 'CAUTION', text: 'text-amber-300', border: 'border-amber-400/60', bg: 'bg-amber-400/10', solid: 'bg-amber-300 text-slate-950' },
  red: { word: 'ALERT', text: 'text-red-400', border: 'border-red-500/70', bg: 'bg-red-500/10', solid: 'bg-red-500 text-white' },
  none: { word: 'NO DATA', text: 'text-slate-400', border: 'border-slate-800', bg: 'bg-slate-900', solid: 'bg-slate-700 text-slate-200' },
}

// Badge colors for the four response levels (keyed by RESPONSE_LEVELS id).
export const LEVEL_BADGE = {
  ground: 'bg-sky-500/15 text-sky-300 border-sky-500/40',
  shared: 'bg-amber-400/15 text-amber-300 border-amber-400/40',
  crew: 'bg-orange-500/15 text-orange-300 border-orange-500/50',
  autonomous: 'bg-red-500/15 text-red-300 border-red-500/60',
}
