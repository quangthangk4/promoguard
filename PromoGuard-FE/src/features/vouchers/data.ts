import type { ClaimedVoucher, Voucher } from './types'

export const vouchers: Voucher[] = [
  {
    id: 'CMP-FLASH-0626',
    title: 'Summer Flash Voucher',
    merchant: 'PromoGuard Mall',
    category: 'Shopping',
    status: 'Active',
    stock: 1000,
    remaining: 347,
    startTime: '2026-06-01T00:00:00Z',
    endTime: '2026-12-31T23:59:59Z',
    rawStatus: 'ACTIVE',
  },
  {
    id: 'CMP-FOOD-0618',
    title: 'Lunch Rush Coupon',
    merchant: 'Urban Bites',
    category: 'Food',
    status: 'Active',
    stock: 1200,
    remaining: 92,
    startTime: '2026-06-01T00:00:00Z',
    endTime: '2026-12-31T23:59:59Z',
    rawStatus: 'ACTIVE',
  },
]

export const claimedVouchers: ClaimedVoucher[] = [
  {
    code: 'SUMMER-9X2K',
    campaignId: 'CMP-FLASH-0626',
    voucherTitle: 'Summer Flash Voucher',
    claimedAt: '2026-06-18T16:41:00Z',
  },
]
