const StatCard = ({ title, value, note }) => {
  return (
    <article className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{title}</p>
      <h3 className="mt-3 text-3xl font-semibold text-slate-900">{value}</h3>
      {note ? <p className="mt-2 text-sm text-slate-500">{note}</p> : null}
    </article>
  )
}

export default StatCard
