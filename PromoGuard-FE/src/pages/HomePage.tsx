import { useEffect, useState } from 'react'
import { ShieldCheck, Ticket, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Role } from '../features/auth'
import { VoucherGrid } from '../features/vouchers/components/VoucherGrid'
import { VoucherProgress } from '../features/vouchers/components/VoucherProgress'
import type { CampaignResponse, Voucher } from '../features/vouchers/types'
import { mapCampaignToVoucher } from '../features/vouchers/utils'
import { SectionHead } from '../shared/components/SectionHead'
import api from '../shared/lib/api'

export function HomePage({ role }: { role: Role }) {
  const [vouchersList, setVouchersList] = useState<Voucher[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    api.get<{ data: CampaignResponse[] }>('/api/v1/campaigns')
      .then((response) => {
        if (active) {
          const mapped = (response.data.data || []).map(mapCampaignToVoucher)
          setVouchersList(mapped)
          setLoading(false)
        }
      })
      .catch((err) => {
        console.error('Failed to load campaigns', err)
        if (active) {
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [])

  return (
    <div className="grid gap-8">
      <section className="grid min-h-[calc(100vh-9rem)] items-center gap-8 py-4 lg:grid-cols-[minmax(0,1fr)_minmax(360px,440px)]">
        <div>
          <p className="text-xs font-black uppercase text-warning">Safe voucher claiming under pressure</p>
          <h1 className="mt-2 max-w-3xl text-4xl font-black leading-tight text-base-content sm:text-5xl">
            Voucher mở bán lớn, claim nhanh, không oversell.
          </h1>
          <p className="mt-4 max-w-2xl text-base-content/70">
            PromoGuard mô phỏng luồng người dùng săn voucher số lượng giới hạn,
            đồng thời để admin theo dõi stock, idempotency, throughput và event.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link className="btn btn-primary" to="/vouchers">
              <Ticket size={18} />
              Xem voucher
            </Link>
            <Link className="btn btn-outline" to={role === 'admin' ? '/admin' : '/login'}>
              <ShieldCheck size={18} />
              Khu quản trị
            </Link>
          </div>
        </div>

        <div className="card relative overflow-hidden border border-white/70 bg-slate-950 text-slate-100 shadow-2xl shadow-slate-900/20 [&_.voucher-progress-labels]:text-slate-300">
          <div className="hero-signal absolute inset-0 opacity-90" />
          <div className="card-body gap-5">
            <div className="flex items-center justify-between gap-4">
              <span className="font-bold text-slate-300">Live campaign</span>
            </div>
            {loading ? (
              <div className="grid min-h-32 place-items-center">
                <Loader2 className="animate-spin text-slate-300" size={24} />
              </div>
            ) : (
              vouchersList.slice(0, 3).map((voucher) => (
                <VoucherProgress key={voucher.id} voucher={voucher} />
              ))
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4">
        <SectionHead eyebrow="Featured vouchers" title="Voucher đang được săn nhiều">
          <Link className="link link-primary font-bold no-underline" to="/vouchers">
            Xem tất cả
          </Link>
        </SectionHead>
        {loading ? (
          <div className="grid min-h-32 place-items-center">
            <Loader2 className="animate-spin text-primary" size={24} />
          </div>
        ) : (
          <VoucherGrid vouchers={vouchersList.slice(0, 3)} role={role} />
        )}
      </section>
    </div>
  )
}
