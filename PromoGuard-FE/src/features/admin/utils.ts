import type { EventItem } from './types'

export function eventDotClass(status: EventItem['status']) {
  const classes = {
    info: 'bg-info',
    pending: 'bg-warning',
    success: 'bg-success',
  }

  return classes[status]
}
