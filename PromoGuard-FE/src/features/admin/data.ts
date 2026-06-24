import type { EventItem } from './types'

export const events: EventItem[] = [
  {
    time: '16:41:08',
    title: 'VoucherClaimedEvent published',
    detail: 'Kafka topic voucher.claimed partition 2 offset 184231',
    status: 'success',
  },
  {
    time: '16:41:07',
    title: 'Idempotency replay detected',
    detail: 'Returned cached response for key idem_9f1a22',
    status: 'info',
  },
  {
    time: '16:41:06',
    title: 'Outbox worker batch locked',
    detail: '100 rows selected with FOR UPDATE SKIP LOCKED',
    status: 'pending',
  },
]
