import type { ReactNode } from 'react'

export function SectionHead({
  children,
  eyebrow,
  title,
}: {
  children?: ReactNode
  eyebrow: string
  title: string
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-xs font-black uppercase text-warning">{eyebrow}</p>
        <h1 className="text-3xl font-black leading-tight sm:text-4xl">{title}</h1>
      </div>
      {children}
    </div>
  )
}
