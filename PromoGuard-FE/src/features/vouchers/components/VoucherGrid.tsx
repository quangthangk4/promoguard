import { useState } from 'react'
import { Ticket, Sparkles, AlertCircle, CheckCircle2, Clock, Calendar, Info, Loader2, Lock } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Role } from '../../auth'
import type { CampaignResponse, ClaimResponse, Voucher } from '../types'
import { statusBadgeClass, formatDate, formatNumber } from '../utils'
import { VoucherProgress } from './VoucherProgress'
import api from '../../../shared/lib/api'

function VoucherCard({ voucher, role, onClaimed }: { voucher: Voucher; role: Role; onClaimed?: () => void }) {
  const [claiming, setClaiming] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [localRemaining, setLocalRemaining] = useState(voucher.remaining)

  const [showDetailModal, setShowDetailModal] = useState(false)
  const [detailLoading, setDetailLoading] = useState(false)
  const [detailData, setDetailData] = useState<CampaignResponse | null>(null)

  const handleOpenDetail = async () => {
    setShowDetailModal(true)
    setDetailLoading(true)
    try {
      const response = await api.get<{ data: CampaignResponse }>(`/api/v1/campaigns/${voucher.id}`)
      setDetailData(response.data.data)
    } catch (err) {
      console.error('Failed to load campaign detail', err)
    } finally {
      setDetailLoading(false)
    }
  }

  const handleClaim = async () => {
    if (role === 'guest') return

    setClaiming(true)
    setMessage(null)
    try {
      const response = await api.post<{
        success: boolean
        message: string
        data?: ClaimResponse
      }>(`/api/v1/campaigns/${voucher.id}/claim`)

      const apiResp = response.data

      if (apiResp.success || apiResp.data?.result === 'SUCCESS') {
        setMessage({
          type: 'success',
          text: apiResp.data?.message || apiResp.message || 'Săn voucher thành công!',
        })
        setLocalRemaining((prev) => Math.max(0, prev - 1))
        if (onClaimed) onClaimed()
      } else {
        setMessage({
          type: 'error',
          text: apiResp.message || apiResp.data?.message || 'Claim thất bại',
        })
      }
    } catch (error: any) {
      console.error(error)
      const errorMsg =
        error.response?.data?.message ||
        error.response?.data?.data?.message ||
        'Có lỗi xảy ra khi claim voucher'
      setMessage({ type: 'error', text: errorMsg })
    } finally {
      setClaiming(false)
    }
  }

  const displayRemaining = Math.min(localRemaining, voucher.remaining)
  const isSoldOut = displayRemaining <= 0 || voucher.status === 'Sold out' || voucher.status === 'Ended'
  const isDraft = voucher.status === 'Draft'
  const canClaim = !isSoldOut && !isDraft && role !== 'guest'

  const currentVoucher: Voucher = {
    ...voucher,
    remaining: displayRemaining,
  }

  return (
    <>
      <article className="glass-panel glass-panel-hover relative flex flex-col justify-between overflow-hidden rounded-3xl p-6 transition-all">
        {/* Header Badge & Title */}
        <div>
          <div className="flex items-start justify-between gap-3 mb-4">
            <span className="flex items-center gap-1.5 rounded-xl bg-indigo-500/10 px-3 py-1 text-xs font-bold text-indigo-400 border border-indigo-500/20">
              <Ticket size={14} />
              {voucher.merchant}
            </span>
            <span className={`rounded-xl px-3 py-1 text-xs font-bold border backdrop-blur-md ${statusBadgeClass(voucher.status)}`}>
              {voucher.status}
            </span>
          </div>

          <h3
            className="text-xl font-black text-white hover:text-indigo-400 cursor-pointer transition-colors line-clamp-2 leading-snug mb-3"
            onClick={handleOpenDetail}
            title="Click để xem chi tiết"
          >
            {voucher.title}
          </h3>

          <div className="flex items-center gap-4 text-xs text-slate-400 mb-5">
            <span className="flex items-center gap-1">
              <Calendar size={14} className="text-slate-500" />
              BD: {formatDate(voucher.startTime)}
            </span>
            <span className="flex items-center gap-1">
              <Clock size={14} className="text-slate-500" />
              KT: {formatDate(voucher.endTime)}
            </span>
          </div>

          {/* Progress Bar */}
          <div className="mb-6 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
            <VoucherProgress voucher={currentVoucher} />
          </div>
        </div>

        {/* Claim Action & Feedback */}
        <div className="mt-2 flex flex-col gap-3">
          {message && (
            <div
              className={`flex items-center gap-2 rounded-xl p-3 text-xs font-semibold animate-in fade-in slide-in-from-top-1 ${
                message.type === 'success'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
              }`}
            >
              {message.type === 'success' ? (
                <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle size={16} className="shrink-0 text-rose-400" />
              )}
              <span>{message.text}</span>
            </div>
          )}

          {role === 'guest' ? (
            <Link
              to="/login"
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-indigo-500/30 bg-indigo-500/10 py-3 text-sm font-bold text-indigo-300 hover:bg-indigo-500/20 transition"
            >
              <Lock size={16} />
              Đăng nhập để nhận voucher
            </Link>
          ) : (
            <button
              type="button"
              disabled={!canClaim || claiming}
              onClick={handleClaim}
              className={`flex w-full items-center justify-center gap-2 rounded-2xl py-3 text-sm font-bold shadow-lg transition-all cursor-pointer ${
                canClaim
                  ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white shadow-emerald-600/25 active:scale-[0.98]'
                  : 'bg-slate-800 text-slate-500 border border-slate-700/50 cursor-not-allowed'
              }`}
            >
              {claiming ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Đang gửi request...
                </>
              ) : isSoldOut ? (
                'Đã hết lượt (Sold out)'
              ) : isDraft ? (
                'Chưa bắt đầu (Draft)'
              ) : (
                <>
                  <Sparkles size={18} />
                  Săn Voucher Ngay
                </>
              )}
            </button>
          )}
        </div>
      </article>

      {/* Campaign Detail Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-700">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h4 className="text-lg font-bold text-white flex items-center gap-2">
                <Info className="text-indigo-400" size={20} />
                Chi tiết Chiến dịch
              </h4>
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="text-slate-400 hover:text-white text-sm font-bold rounded-lg p-1 hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {detailLoading ? (
              <div className="grid h-48 place-items-center">
                <Loader2 className="animate-spin text-indigo-400" size={32} />
              </div>
            ) : detailData ? (
              <div className="mt-4 flex flex-col gap-4 text-sm">
                <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800">
                  <span className="text-xs text-slate-400 font-semibold block mb-1">Tên chiến dịch</span>
                  <p className="text-base font-bold text-white">{detailData.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
                    <span className="text-xs text-slate-400 font-semibold block mb-1">Tổng số lượng</span>
                    <p className="text-lg font-black text-indigo-400">{formatNumber(detailData.totalQuantity)}</p>
                  </div>

                  <div className="bg-slate-900/80 p-3.5 rounded-2xl border border-slate-800">
                    <span className="text-xs text-slate-400 font-semibold block mb-1">Số lượng còn lại</span>
                    <p className="text-lg font-black text-emerald-400">{formatNumber(detailData.remainingQuantity)}</p>
                  </div>
                </div>

                <div className="space-y-2 text-xs text-slate-300 bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Trạng thái:</span>
                    <span className="font-bold text-amber-400">{detailData.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Thời gian bắt đầu:</span>
                    <span className="font-mono text-slate-200">{formatDate(detailData.startTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Thời gian kết thúc:</span>
                    <span className="font-mono text-slate-200">{formatDate(detailData.endTime)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">ID Chiến dịch:</span>
                    <span className="font-mono text-slate-400 text-[10px]">{detailData.id}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="py-6 text-center text-slate-400">Không thể tải thông tin chiến dịch.</p>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowDetailModal(false)}
                className="rounded-xl bg-slate-800 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-700 transition"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export function VoucherGrid({
  vouchers,
  role,
  onClaimed,
}: {
  vouchers: Voucher[]
  role: Role
  onClaimed?: () => void
}) {
  if (vouchers.length === 0) {
    return (
      <div className="glass-panel flex flex-col items-center justify-center rounded-3xl p-12 text-center">
        <Ticket className="mb-3 text-slate-600" size={48} />
        <h4 className="text-lg font-bold text-white">Không tìm thấy voucher phù hợp</h4>
        <p className="text-sm text-slate-400 mt-1 max-w-md">
          Hiện tại không có chiến dịch voucher nào khả dụng hoặc không khớp với từ khóa tìm kiếm của bạn.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {vouchers.map((voucher) => (
        <VoucherCard key={voucher.id} voucher={voucher} role={role} onClaimed={onClaimed} />
      ))}
    </div>
  )
}
