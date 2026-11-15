// OrbitCare wordmark: name, orbit swoosh and a four-point star.
// Drawn as SVG so it stays sharp at any size and works offline.
// The swoosh is one tilted ellipse; strokeDasharray hides the part behind the letters.
export default function Logo({ className = 'h-10' }) {
  return (
    <svg viewBox="0 0 300 96" className={className} role="img" aria-label="OrbitCare">
      <ellipse
        cx="150"
        cy="54"
        rx="146"
        ry="32"
        transform="rotate(-14 150 54)"
        fill="none"
        stroke="currentColor"
        strokeWidth="3.5"
        strokeLinecap="round"
        pathLength="100"
        strokeDasharray="7 20 19 25 29 0"
      />
      <path d="M134 0 Q135.4 9.6 145 11 Q135.4 12.4 134 22 Q132.6 12.4 123 11 Q132.6 9.6 134 0 Z" fill="currentColor" />
      <text
        x="150"
        y="72"
        textAnchor="middle"
        textLength="262"
        lengthAdjust="spacingAndGlyphs"
        fill="currentColor"
        style={{ fontFamily: 'Inter, sans-serif', fontWeight: 800, fontSize: 54, letterSpacing: '-0.02em' }}
      >
        OrbitCare
      </text>
    </svg>
  )
}
