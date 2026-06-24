export function PromoBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(18,102,79,0.18)_0%,rgba(255,255,255,0)_34%,rgba(36,87,166,0.14)_70%,rgba(255,255,255,0)_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(rgba(17,24,39,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(17,24,39,0.045)_1px,transparent_1px)] bg-[size:44px_44px]" />
      <div className="voucher-flow absolute -left-24 top-28 h-36 w-[130vw] rotate-[-8deg] opacity-80" />
      <div className="voucher-flow voucher-flow-secondary absolute -right-32 bottom-24 h-28 w-[120vw] rotate-[7deg] opacity-60" />
      <div className="absolute inset-x-0 top-0 h-56 bg-gradient-to-b from-white/85 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-[#eef4f8] to-transparent" />
    </div>
  )
}
