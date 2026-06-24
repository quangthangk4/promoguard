import type { Voucher } from '../types'
import { formatNumber, remainingPercent } from '../utils'

export function VoucherProgress({ voucher }: { voucher: Voucher }) {
  return (
    <div className="grid gap-2">
      <div className="voucher-progress-labels flex justify-between gap-3 text-xs font-black text-base-content/60">
        <span>{formatNumber(voucher.remaining)} còn lại</span>
        <span>{formatNumber(voucher.stock)} tổng</span>
      </div>
      <progress
        className="progress progress-primary h-2"
        max="100"
        value={remainingPercent(voucher)}
      />
    </div>
  )
}
