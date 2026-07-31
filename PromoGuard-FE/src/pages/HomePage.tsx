import { useEffect, useState } from 'react'
import { ShieldCheck, Ticket, ArrowRight, Zap, Lock, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Role } from '../features/auth'
import { VoucherGrid } from '../features/vouchers/components/VoucherGrid'
import { VoucherProgress } from '../features/vouchers/components/VoucherProgress'
import type { CampaignResponse, Voucher } from '../features/vouchers/types'
import { mapCampaignToVoucher } from '../features/vouchers/utils'
import api from '../shared/lib/api'

export function HomePage({ role }: { role: Role }) {
  const [vouchersList, setVouchersList] = useState<Voucher[]>([])
  const [loading, setLoading] = useState(true)

  const loadCampaigns = async () => {
    try {
      const response = await api.get<{ data: CampaignResponse[] }>('/api/v1/campaigns?status=ACTIVE')
      const mapped = (response.data.data || [])
        .map(mapCampaignToVoucher)
        .filter((v) => v.status === 'Active')
      setVouchersList(mapped)
    } catch (err) {
      console.error('Failed to load campaigns', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCampaigns()
  }, [])

  return (
    <div className="flex flex-col gap-14 py-4">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60 p-8 sm:p-12 lg:p-16 backdrop-blur-2xl">
        <div className="hero-signal absolute inset-0 opacity-40 pointer-events-none" />

        <div className="relative z-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-indigo-500/10 px-4 py-1.5 text-xs font-bold text-indigo-400 border border-indigo-500/20 mb-6">
              <Zap size={14} className="text-amber-400" />
              High-Throughput Voucher Reservation System
            </div>

            <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl leading-[1.1] mb-6">
              Săn Voucher Tốc Độ Cao{' '}
              <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-emerald-400 bg-clip-text text-transparent">
                Không Oversell
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-300 max-w-2xl leading-relaxed mb-8">
              PromoGuard giải quyết bài toán concurrency khi hàng vạn người dùng cùng săn voucher một lúc.
              Tích hợp Redis Caching, Kafka Event Outbox, Rate Limiting và Keycloak OAuth2.
            </p>

            <div className="flex flex-wrap items-center gap-4">
              <Link
                to="/vouchers"
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold px-6 py-3.5 shadow-lg shadow-indigo-600/30 transition hover:scale-[1.02] active:scale-[0.98]"
              >
                <Ticket size={20} />
                Khám phá Voucher
                <ArrowRight size={18} />
              </Link>

              {role === 'admin' ? (
                <Link
                  to="/admin"
                  className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-white font-bold px-6 py-3.5 transition"
                >
                  <ShieldCheck size={20} className="text-amber-400" />
                  Bảng Quản Trị
                </Link>
              ) : role === 'guest' ? (
                <Link
                  to="/login"
                  className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-slate-300 font-bold px-6 py-3.5 transition"
                >
                  <Lock size={18} />
                  Đăng nhập săn voucher
                </Link>
              ) : (
                <Link
                  to="/user/vouchers"
                  className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 text-emerald-400 font-bold px-6 py-3.5 transition"
                >
                  Voucher của tôi
                </Link>
              )}
            </div>
          </div>

          {/* Live Ticker Side Card */}
          <div className="glass-panel relative flex flex-col gap-5 rounded-3xl p-6 border border-slate-700/60 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2 font-bold text-white text-sm">
                <span className="relative flex size-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-emerald-500" />
                </span>
                Live Campaigns Stock
              </div>
              <span className="text-xs text-slate-400 font-mono">Realtime</span>
            </div>

            {loading ? (
              <div className="grid h-44 place-items-center">
                <Loader2 className="animate-spin text-indigo-400" size={28} />
              </div>
            ) : vouchersList.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">Chưa có chiến dịch nào khả dụng.</p>
            ) : (
              <div className="flex flex-col gap-4">
                {vouchersList.slice(0, 3).map((voucher) => (
                  <div key={voucher.id} className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
                    <p className="text-xs font-bold text-slate-200 truncate mb-2">{voucher.title}</p>
                    <VoucherProgress voucher={voucher} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Featured Vouchers Grid */}
      <section className="flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 block mb-1">
              Active Campaigns
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">Voucher Đang Diễn Ra</h2>
          </div>

          <Link
            to="/vouchers"
            className="flex items-center gap-1.5 text-sm font-bold text-indigo-400 hover:text-indigo-300 transition"
          >
            Xem tất cả
            <ArrowRight size={16} />
          </Link>
        </div>

        {loading ? (
          <div className="grid min-h-64 place-items-center">
            <Loader2 className="animate-spin text-indigo-400" size={32} />
          </div>
        ) : (
          <VoucherGrid vouchers={vouchersList.slice(0, 6)} role={role} onClaimed={loadCampaigns} />
        )}
      </section>
    </div>
  )
}
