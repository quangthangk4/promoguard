import type { CampaignResponse, ClaimedVoucher, Voucher } from './types'

export function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value)
}

export function remainingPercent(voucher: Voucher) {
  return Math.round((voucher.remaining / voucher.stock) * 100)
}

export function claimStatusClass(status: ClaimedVoucher['status']) {
  const classes = {
    Active: 'badge badge-success font-black text-success-content',
    Expired: 'badge badge-error font-black text-error-content',
    Used: 'badge badge-warning font-black text-warning-content',
  }

  return classes[status]
}

export function voucherAccentClass(category: Voucher['category']) {
  const classes: Record<Voucher['category'], string> = {
    Food: 'bg-gradient-to-br from-rose-500 to-orange-500',
    Shopping: 'bg-gradient-to-br from-sky-600 to-blue-700',
    Ticket: 'bg-gradient-to-br from-violet-600 to-indigo-700',
    Travel: 'bg-gradient-to-br from-emerald-600 to-teal-700',
  }

  return classes[category]
}

export function statusDotClass(status: Voucher['status']) {
  const classes = {
    Open: 'bg-success',
    Scheduled: 'bg-info',
    'Sold out': 'bg-error',
  }

  return classes[status]
}

export function mapCampaignToVoucher(campaign: CampaignResponse): Voucher {
  const lowercaseName = campaign.name.toLowerCase()
  let category: Voucher['category'] = 'Shopping'
  if (lowercaseName.includes('food') || lowercaseName.includes('eat') || lowercaseName.includes('lunch') || lowercaseName.includes('bites') || lowercaseName.includes('coffee') || lowercaseName.includes('drink')) {
    category = 'Food'
  } else if (lowercaseName.includes('ticket') || lowercaseName.includes('concert') || lowercaseName.includes('show') || lowercaseName.includes('movie')) {
    category = 'Ticket'
  } else if (lowercaseName.includes('ride') || lowercaseName.includes('travel') || lowercaseName.includes('flight') || lowercaseName.includes('taxi') || lowercaseName.includes('move')) {
    category = 'Travel'
  }

  let value = 'Voucher'
  const pctMatch = campaign.name.match(/\d+%/);
  if (pctMatch) {
    value = `${pctMatch[0]} off`
  } else {
    const amountMatch = campaign.name.match(/\d+([.,]\d+)?\s*(k|VND|đ)/i)
    if (amountMatch) {
      value = amountMatch[0].toUpperCase()
    }
  }

  const now = new Date()
  const start = new Date(campaign.startTime)
  const end = new Date(campaign.endTime)

  let status: Voucher['status'] = 'Open'
  let endsAt = 'Active'

  if (campaign.remainingQuantity <= 0) {
    status = 'Sold out'
    endsAt = 'Ended'
  } else if (campaign.status === 'DRAFT' || now < start) {
    status = 'Scheduled'
    const startStr = start.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
    endsAt = `Opens ${startStr}`
  } else if (campaign.status === 'ENDED' || now > end) {
    status = 'Sold out'
    endsAt = 'Ended'
  } else {
    status = 'Open'
    const isToday = end.toDateString() === now.toDateString()
    if (isToday) {
      const timeStr = end.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
      endsAt = `${timeStr} today`
    } else {
      endsAt = end.toLocaleDateString('vi-VN', { month: 'short', day: 'numeric' })
    }
  }

  return {
    id: campaign.id,
    title: campaign.name,
    merchant: 'PromoGuard Mall',
    category,
    status,
    stock: campaign.totalQuantity,
    remaining: campaign.remainingQuantity,
    endsAt,
    value,
    rawStatus: campaign.status,
  }
}
