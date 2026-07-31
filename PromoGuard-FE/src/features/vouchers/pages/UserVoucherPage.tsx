import { useEffect, useState } from 'react'
import { Ticket, Copy, Check, Calendar, Loader2, Lock, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Role } from '../../auth'
import type { UserClaimResponse } from '../types'
import { formatDate } from '../utils'
import api from '../../../shared/lib/api'

export function UserVoucherPage({ role }: { role: Role }) {
  const [claims, setClaims] = useState<UserClaimResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    if (role === 'guest') {
      setLoading(false)
      return
    }

    api.get<{ data: UserClaimResponse[] }>('/api/v1/campaigns/my-claims')
      .then((res) => {
        setClaims(res.data.data || [])
      })
      .catch((err) => {
        console.error('Failed to load user claims', err)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [role])

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code)
    setCopiedId(code)
    setTimeout(() => setCopiedId(null), 2000)
  }

  if (role === 'guest') {
    return (
      <div className="glass-panel mx-auto my-12 flex max-w-md flex-col items-center justify-center rounded-3xl p-8 text-center">
        <div className="flex size-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-4">
          <Lock size={28} />
        </div>
        <h2 className="text-xl font-black text-white">Yêu Cầu Đăng Nhập</h2>
        <p className="mt-2 text-sm text-slate-400 leading-relaxed mb-6">
          Bạn cần đăng nhập để xem danh sách voucher đã săn thành công.
        </p>
        <Link
          to="/login"
          className="rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 text-sm shadow-lg shadow-indigo-600/30 transition"
        >
          Đăng nhập ngay
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-8 py-4">
      {/* Page Header */}
      <div className="glass-panel flex items-center justify-between rounded-3xl p-6 sm:p-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block mb-1">
            User Wallet
          </span>
          <h1 className="text-3xl font-black text-white">Voucher Đã Săn Của Tôi</h1>
        </div>
        <div className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-400 border border-emerald-500/20">
          <Sparkles size={16} />
          {claims.length} Voucher
        </div>
      </div>

      {/* Claims List */}
      {loading ? (
        <div className="grid min-h-64 place-items-center">
          <Loader2 className="animate-spin text-indigo-400" size={36} />
        </div>
      ) : claims.length === 0 ? (
        <div className="glass-panel flex flex-col items-center justify-center rounded-3xl p-12 text-center">
          <Ticket className="mb-3 text-slate-600" size={48} />
          <h3 className="text-lg font-bold text-white">Bạn chưa săn được voucher nào</h3>
          <p className="mt-1 text-sm text-slate-400 max-w-md mb-6">
            Hãy khám phá danh sách các chiến dịch voucher đang diễn ra và tham gia săn ngay!
          </p>
          <Link
            to="/vouchers"
            className="rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-bold px-6 py-3 text-sm shadow-lg shadow-emerald-600/30 transition hover:scale-105"
          >
            Săn Voucher Ngay
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {claims.map((claim) => (
            <article
              key={claim.claimId}
              className="glass-panel glass-panel-hover flex flex-col justify-between rounded-3xl p-6 border border-slate-800"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span className="flex items-center gap-1.5 rounded-xl bg-emerald-500/10 px-3 py-1 text-xs font-bold text-emerald-400 border border-emerald-500/20">
                    <Ticket size={14} />
                    CLAIMED
                  </span>
                  <span className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                    <Calendar size={12} />
                    {formatDate(claim.claimedAt)}
                  </span>
                </div>

                <h3 className="text-lg font-black text-white leading-snug mb-4">
                  {claim.campaignName}
                </h3>
              </div>

              {/* Code display with copy button */}
              <div className="mt-4 bg-slate-900/80 p-3 rounded-2xl border border-slate-800 flex items-center justify-between">
                <div>
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                    Mã Claim ID
                  </span>
                  <code className="text-xs font-mono font-bold text-indigo-300 truncate max-w-[180px] block">
                    {claim.claimId}
                  </code>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopy(claim.claimId)}
                  className="flex items-center gap-1 rounded-xl bg-slate-800 hover:bg-slate-700 p-2 text-xs font-bold text-slate-300 transition cursor-pointer"
                  title="Sao chép mã"
                >
                  {copiedId === claim.claimId ? (
                    <Check size={16} className="text-emerald-400" />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  )
}
