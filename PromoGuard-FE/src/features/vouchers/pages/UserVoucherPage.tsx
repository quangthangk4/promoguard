import { useEffect, useState } from 'react'
import { KeyRound, Ticket, Loader2 } from 'lucide-react'
import type { Role } from '../../auth'
import { AuthRequired } from '../../../shared/components/AuthRequired'
import { SectionHead } from '../../../shared/components/SectionHead'
import type { UserClaimResponse, ClaimedVoucher } from '../types'
import { claimStatusClass } from '../utils'
import api from '../../../shared/lib/api'

export function UserVoucherPage({ role }: { role: Role }) {
  const [claims, setClaims] = useState<ClaimedVoucher[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (role === 'guest') {
      return
    }

    let active = true
    api.get<{ data: UserClaimResponse[] }>('/api/v1/campaigns/my-claims')
      .then((response) => {
        if (active) {
          const mapped: ClaimedVoucher[] = (response.data.data || []).map((claim) => ({
            code: claim.claimId,
            voucherTitle: claim.campaignName,
            claimedAt: new Date(claim.claimedAt).toLocaleDateString('vi-VN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            }),
            status: 'Active',
          }))
          setClaims(mapped)
          setLoading(false)
        }
      })
      .catch((err) => {
        console.error('Failed to load user claims', err)
        if (active) {
          setLoading(false)
        }
      })

    return () => {
      active = false
    }
  }, [role])

  if (role === 'guest') {
    return <AuthRequired title="Bạn cần đăng nhập để xem voucher đã claim." />
  }

  return (
    <section className="grid gap-5">
      <SectionHead eyebrow="User role" title="Voucher của tôi">
        <span className="badge badge-success gap-2 p-4 text-success-content">
          <KeyRound size={15} />
          Keycloak token active
        </span>
      </SectionHead>

      {loading ? (
        <div className="grid min-h-64 place-items-center">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : claims.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-base-300 p-8 text-center text-base-content/60 bg-base-100">
          Bạn chưa claim voucher nào. Hãy vào trang danh sách voucher để bắt đầu claim!
        </div>
      ) : (
        <div className="grid gap-3">
          {claims.map((voucher) => (
            <article
              className="card border border-base-300 bg-base-100 shadow-sm"
              key={voucher.code}
            >
              <div className="card-body grid gap-4 sm:grid-cols-[auto_minmax(0,1fr)_auto_auto] sm:items-center">
                <span className="grid size-11 place-items-center rounded-lg bg-primary text-primary-content">
                  <Ticket size={19} />
                </span>
                <div>
                  <strong className="block text-base-content">{voucher.voucherTitle}</strong>
                  <p className="text-sm text-base-content/60">Claimed at {voucher.claimedAt}</p>
                </div>
                <code className="rounded-lg bg-base-200 px-3 py-2 font-mono text-sm">
                  {voucher.code}
                </code>
                <span className={claimStatusClass(voucher.status)}>{voucher.status}</span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
