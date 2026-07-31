export function PromoBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      {/* Radial Gradient Glows */}
      <div className="absolute -top-40 -left-40 size-[500px] rounded-full bg-indigo-600/20 blur-[140px]" />
      <div className="absolute top-1/3 -right-40 size-[600px] rounded-full bg-emerald-600/15 blur-[160px]" />
      <div className="absolute -bottom-40 left-1/3 size-[500px] rounded-full bg-purple-600/15 blur-[140px]" />

      {/* Grid Pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
    </div>
  )
}
