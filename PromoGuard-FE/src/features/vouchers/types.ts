export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'ENDED'

export type CampaignResponse = {
  id: string
  name: string
  totalQuantity: number
  remainingQuantity: number
  status: CampaignStatus
  startTime: string // ISO string
  endTime: string // ISO string
  createdAt: string // ISO string
}

export type ClaimResult = 'SUCCESS' | 'SOLD_OUT' | 'ALREADY_CLAIMED' | 'CAMPAIGN_NOT_ACTIVE'

export type ClaimResponse = {
  result: ClaimResult
  message: string
}

export type UserClaimResponse = {
  claimId: string
  campaignId: string
  campaignName: string
  claimedAt: string // ISO string
}

export type AdminClaimResponse = {
  id: string
  userId: string
  claimedAt: string // ISO string
}

export type CampaignStatsResponse = {
  campaignId: string
  name: string
  totalQuantity: number
  remainingQuantity: number
  claimedCount: number
  status: CampaignStatus
}

export type Voucher = {
  id: string
  title: string
  merchant: string
  category: string
  status: 'Active' | 'Draft' | 'Ended' | 'Sold out'
  stock: number
  remaining: number
  startTime: string
  endTime: string
  rawStatus: CampaignStatus
}

export type ClaimedVoucher = {
  code: string
  campaignId: string
  voucherTitle: string
  claimedAt: string
}
