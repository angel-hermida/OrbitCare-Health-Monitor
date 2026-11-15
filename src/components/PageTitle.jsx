// Section / page title from the style guide: bold, one word in red, thin blue rule to the right.
//   <PageTitle title="Health Status" accent="Status" />
// `accent` must appear in `title`; leave it out for a plain title.
export default function PageTitle({ title, accent, as: Tag = 'h1', size = 'text-3xl' }) {
  const i = accent ? title.indexOf(accent) : -1
  const text =
    i < 0 ? (
      title
    ) : (
      <>
        {title.slice(0, i)}
        <span className="text-oc-red">{accent}</span>
        {title.slice(i + accent.length)}
      </>
    )

  return (
    <div className="flex items-center gap-5">
      <Tag className={`${size} shrink-0 font-bold tracking-tight text-white`}>{text}</Tag>
      <span className="h-0.5 min-w-8 flex-1 bg-oc-blue" aria-hidden="true" />
    </div>
  )
}
