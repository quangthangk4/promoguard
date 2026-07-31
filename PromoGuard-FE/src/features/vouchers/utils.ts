import type { CampaignResponse, Voucher, CampaignStatus } from './types'

export function formatNumber(value: number) {
  return new Intl.NumberFormat('vi-VN').format(value)
}

export function formatDate(dateString: string) {
  if (!dateString) return 'N/A'
  try {
    const d = new Date(dateString)
    return d.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateString
  }
}

export function remainingPercent(voucher: Voucher) {
  if (!voucher.stock || voucher.stock <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((voucher.remaining / voucher.stock) * 100)))
}

export function statusBadgeClass(status: Voucher['status']) {
  switch (status) {
    case 'Active':
      return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
    case 'Draft':
      return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30'
    case 'Ended':
      return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30'
    case 'Sold out':
      return 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30'
    default:
      return 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30'
  }
}

export function rawStatusBadgeClass(status: CampaignStatus) {
  switch (status) {
    case 'ACTIVE':
      return 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
    case 'DRAFT':
      return 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
    case 'ENDED':
      return 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
  }
}

export function mapCampaignToVoucher(campaign: CampaignResponse): Voucher {
  let status: Voucher['status'] = 'Active'

  if (campaign.status === 'DRAFT') {
    status = 'Draft'
  } else if (campaign.status === 'ENDED') {
    status = 'Ended'
  } else if (campaign.remainingQuantity <= 0) {
    status = 'Sold out'
  } else {
    status = 'Active'
  }

  return {
    id: campaign.id,
    title: campaign.name,
    merchant: 'PromoGuard Exclusive',
    category: 'PROMO',
    status,
    stock: campaign.totalQuantity,
    remaining: campaign.remainingQuantity,
    startTime: campaign.startTime,
    endTime: campaign.endTime,
    rawStatus: campaign.status,
  }
}
