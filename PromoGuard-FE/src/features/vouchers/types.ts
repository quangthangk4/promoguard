export type Voucher = {
  id: string
  title: string
  merchant: string
  category: 'Shopping' | 'Food' | 'Ticket' | 'Travel'
  status: 'Open' | 'Scheduled' | 'Sold out'
  stock: number
  remaining: number
  endsAt: string
  value: string
  rawStatus?: 'DRAFT' | 'ACTIVE' | 'ENDED'
}

export type ClaimedVoucher = {
  code: string
  voucherTitle: string
  claimedAt: string
  status: 'Active' | 'Used' | 'Expired'
}

export type CampaignResponse = {
  id: string
  name: string
  totalQuantity: number
  remainingQuantity: number
  status: 'DRAFT' | 'ACTIVE' | 'ENDED'
  startTime: string // ISO string
  endTime: string // ISO string
  createdAt: string // ISO string
}

export type UserClaimResponse = {
  claimId: string
  campaignId: string
  campaignName: string
  claimedAt: string // ISO string
}
