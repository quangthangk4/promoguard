import type { ReactNode } from 'react'

export function Metric({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <article className="card border border-base-300 bg-base-100 shadow-sm">
      <div className="card-body grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 p-4">
        <span className="row-span-2 grid size-10 place-items-center rounded-lg bg-info/15 text-info">
          {icon}
        </span>
        <p className="m-0 text-sm text-base-content/60">{label}</p>
        <strong className="text-2xl leading-none">{value}</strong>
      </div>
    </article>
  )
}
