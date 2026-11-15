// Segmented toggle: a row of joined buttons, one selected.
//   <Segmented label="Theme" value={theme} options={[['dark', 'Dark'], ['light', 'Light']]} onChange={...} />
export default function Segmented({ label, value, options, onChange }) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex overflow-hidden rounded border border-oc-border">
      {options.map(([optionValue, optionLabel], i) => {
        const selected = optionValue === value
        return (
          <button
            key={String(optionValue)}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(optionValue)}
            className={`cursor-pointer px-5 py-2 text-sm font-bold uppercase tracking-wider ${i > 0 ? 'border-l border-oc-border' : ''} ${
              selected ? 'bg-oc-blue text-oc-paper' : 'text-white/80 hover:bg-oc-panel/50 hover:text-white'
            }`}
          >
            {optionLabel}
          </button>
        )
      })}
    </div>
  )
}
