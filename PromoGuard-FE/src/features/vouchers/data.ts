import type { ClaimedVoucher, Voucher } from './types'

export const vouchers: Voucher[] = [
  {
    id: 'CMP-FLASH-0626',
    title: 'Summer Flash Voucher',
    merchant: 'PromoGuard Mall',
    category: 'Shopping',
    status: 'Open',
    stock: 1000,
    remaining: 347,
    endsAt: '18:30 today',
    value: '40% off',
  },
  {
    id: 'CMP-FOOD-0618',
    title: 'Lunch Rush Coupon',
    merchant: 'Urban Bites',
    category: 'Food',
    status: 'Open',
    stock: 1200,
    remaining: 92,
    endsAt: '13:00 today',
    value: '70,000 VND',
  },
  {
    id: 'CMP-TICKET-0710',
    title: 'Concert Early Bird',
    merchant: 'LiveHouse',
    category: 'Ticket',
    status: 'Scheduled',
    stock: 5000,
    remaining: 5000,
    endsAt: 'Opens Jul 10',
    value: '25% off',
  },
  {
    id: 'CMP-RIDE-0620',
    title: 'Weekend Ride Drop',
    merchant: 'MetroMove',
    category: 'Travel',
    status: 'Sold out',
    stock: 800,
    remaining: 0,
    endsAt: 'Ended',
    value: '30,000 VND',
  },
]

export const claimedVouchers: ClaimedVoucher[] = [
  {
    code: 'SUMMER-9X2K',
    voucherTitle: 'Summer Flash Voucher',
    claimedAt: '18 Jun 2026, 16:41',
    status: 'Active',
  },
  {
    code: 'LUNCH-A81Q',
    voucherTitle: 'Lunch Rush Coupon',
    claimedAt: '18 Jun 2026, 12:04',
    status: 'Used',
  },
]
