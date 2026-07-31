import type { Voucher } from '../types'
import { formatNumber, remainingPercent } from '../utils'

export function VoucherProgress({ voucher }: { voucher: Voucher }) {
  const percent = remainingPercent(voucher)
  
  let barColor = 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-emerald-500/30'
  if (percent <= 20) {
    barColor = 'bg-gradient-to-r from-rose-500 to-amber-500 shadow-rose-500/30'
  } else if (percent <= 50) {
    barColor = 'bg-gradient-to-r from-amber-500 to-emerald-400 shadow-amber-500/30'
  }

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between text-xs font-semibold">
        <span className="text-slate-400">Còn {formatNumber(voucher.remaining)} voucher</span>
        <span className="font-bold text-slate-300">{percent}%</span>
      </div>
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-slate-800 border border-slate-700/60 p-0.5">
        <div
          className={`h-full rounded-full transition-all duration-500 shadow-sm ${barColor}`}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  )
}
