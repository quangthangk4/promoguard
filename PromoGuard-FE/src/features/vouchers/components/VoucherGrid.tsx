import { useState } from 'react'
import { ShoppingBag, Loader2 } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { Role } from '../../auth'
import type { CampaignResponse, Voucher } from '../types'
import { voucherAccentClass, formatNumber } from '../utils'
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
      const response = await api.post<{ success: boolean; message: string }>(
        `/api/v1/campaigns/${voucher.id}/claim`,
      )
      const apiResp = response.data
      if (apiResp.success) {
        setMessage({ type: 'success', text: apiResp.message || 'Claim voucher thành công!' })
        setLocalRemaining((prev) => Math.max(0, prev - 1))
        if (onClaimed) onClaimed()
      } else {
        setMessage({ type: 'error', text: apiResp.message || 'Claim thất bại' })
      }
    } catch (error: any) {
      console.error(error)
      const errorMsg = error.response?.data?.message || 'Có lỗi xảy ra khi claim voucher'
      setMessage({ type: 'error', text: errorMsg })
    } finally {
      setClaiming(false)
    }
  }

  const displayRemaining = Math.min(localRemaining, voucher.remaining)

  const updatedVoucher = {
    ...voucher,
    remaining: displayRemaining,
  }

  const isSoldOut = displayRemaining <= 0 || voucher.status === 'Sold out'
  const isScheduled = voucher.status === 'Scheduled'
  const canClaim = !isSoldOut && !isScheduled && role !== 'guest'

  return (
    <>
      <article className="voucher-ticket group relative overflow-hidden rounded-3xl border border-white/70 bg-white shadow-xl shadow-slate-900/10 transition duration-300 hover:-translate-y-1 hover:shadow-2xl hover:shadow-slate-900/15">
        <div className={`relative p-5 text-white ${voucherAccentClass(voucher.category)}`}>
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_18%_20%,rgba(255,255,255,0.34),transparent_28%),linear-gradient(120deg,rgba(255,255,255,0.18),transparent_48%)]" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-wide text-white/70">
                {voucher.merchant}
              </p>
              <div className="mt-3 text-4xl font-black leading-none tracking-tight">
                {voucher.value}
              </div>
            </div>
            <span className="rounded-full bg-white/18 px-3 py-1 text-xs font-black uppercase backdrop-blur">
              {isSoldOut ? 'Sold out' : voucher.status}
            </span>
          </div>
        </div>

        <div className="relative grid gap-4 p-5">
          <div>
            <div className="flex items-center justify-between gap-3">
              <h3
                className="text-xl font-black leading-tight cursor-pointer hover:text-primary transition"
                onClick={handleOpenDetail}
                title="Click để xem chi tiết"
              >
                {voucher.title}
              </h3>
              <span className="badge badge-ghost shrink-0 font-bold">{voucher.category}</span>
            </div>
            <p className="mt-1 text-sm text-base-content/55">
              Public campaign • one claim per account
            </p>
          </div>

          <VoucherProgress voucher={updatedVoucher} />

          {message && (
            <div
              className={`text-xs font-bold rounded-lg p-2 ${message.type === 'success' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}
            >
              {message.text}
            </div>
          )}

          <div className="voucher-cut relative my-1 border-t border-dashed border-base-300" />

          <div className="grid grid-cols-[1fr_auto] items-center gap-4">
            <div>
              <p className="text-xs font-black uppercase text-base-content/45">Valid until</p>
              <span className="font-black text-base-content/75">{voucher.endsAt}</span>
            </div>
            {role === 'guest' ? (
              <Link className="btn btn-primary min-w-24 rounded-full" to="/login">
                <ShoppingBag size={17} />
                Đăng nhập
              </Link>
            ) : (
              <button
                className={`btn btn-primary min-w-24 rounded-full ${claiming ? 'btn-disabled' : ''} ${!canClaim ? 'btn-disabled' : ''}`}
                type="button"
                disabled={claiming || !canClaim}
                onClick={handleClaim}
              >
                {claiming ? <Loader2 className="animate-spin" size={17} /> : <ShoppingBag size={17} />}
                Claim
              </button>
            )}
          </div>
        </div>
      </article>

      {showDetailModal && (
        <div className="modal modal-open z-50">
          <div className="modal-box max-w-lg bg-base-100 rounded-3xl p-6 relative">
            <button
              className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
              type="button"
              onClick={() => setShowDetailModal(false)}
            >
              ✕
            </button>
            <h3 className="font-black text-2xl text-base-content mb-4">Chi tiết Voucher</h3>

            {detailLoading ? (
              <div className="grid h-40 place-items-center">
                <Loader2 className="animate-spin text-primary" size={28} />
              </div>
            ) : detailData ? (
              <div className="grid gap-4">
                <div className="rounded-2xl bg-base-200 p-4">
                  <span className="text-xs font-black uppercase text-base-content/45">Tên chiến dịch</span>
                  <p className="font-bold text-lg text-primary">{detailData.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs font-black uppercase text-base-content/45">Mã ID</span>
                    <p className="font-mono text-[10px] truncate select-all bg-base-200 p-2 rounded-lg mt-1" title={detailData.id}>
                      {detailData.id}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase text-base-content/45">Trạng thái</span>
                    <div className="mt-1">
                      <span className={`badge font-bold ${
                        detailData.status === 'ACTIVE' ? 'badge-success text-success-content' : 
                        detailData.status === 'DRAFT' ? 'badge-info' : 'badge-ghost'
                      }`}>
                        {detailData.status}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs font-black uppercase text-base-content/45">Thời gian bắt đầu</span>
                    <p className="text-sm font-bold text-base-content/75">
                      {new Date(detailData.startTime).toLocaleString('vi-VN')}
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase text-base-content/45">Thời gian kết thúc</span>
                    <p className="text-sm font-bold text-base-content/75">
                      {new Date(detailData.endTime).toLocaleString('vi-VN')}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="text-xs font-black uppercase text-base-content/45">Tổng phát hành</span>
                    <p className="text-base font-bold text-base-content/80">
                      {formatNumber(detailData.totalQuantity)} voucher
                    </p>
                  </div>
                  <div>
                    <span className="text-xs font-black uppercase text-base-content/45">Còn lại</span>
                    <p className="text-base font-bold text-success">
                      {formatNumber(detailData.remainingQuantity)} voucher
                    </p>
                  </div>
                </div>

                <div className="mt-2">
                  <span className="text-xs font-black uppercase text-base-content/45 block mb-1">Tỷ lệ còn lại</span>
                  <progress
                    className="progress progress-primary w-full h-3"
                    max={detailData.totalQuantity}
                    value={detailData.remainingQuantity}
                  />
                </div>

                <div className="modal-action mt-4">
                  {role === 'guest' ? (
                    <Link className="btn btn-primary w-full rounded-full" to="/login">
                      Đăng nhập để claim
                    </Link>
                  ) : (
                    <button
                      className={`btn btn-primary w-full rounded-full ${claiming ? 'btn-disabled' : ''} ${!canClaim ? 'btn-disabled' : ''}`}
                      disabled={claiming || !canClaim}
                      type="button"
                      onClick={() => {
                        setShowDetailModal(false)
                        void handleClaim()
                      }}
                    >
                      {claiming ? <Loader2 className="animate-spin" size={17} /> : 'Claim ngay'}
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <p className="text-error text-center py-4">Không thể tải thông tin chi tiết.</p>
            )}
          </div>
        </div>
      )}
    </>
  )
}

export function VoucherGrid({
  role,
  vouchers,
  onClaimed,
}: {
  role: Role
  vouchers: Voucher[]
  onClaimed?: () => void
}) {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {vouchers.map((voucher) => (
        <VoucherCard key={voucher.id} voucher={voucher} role={role} onClaimed={onClaimed} />
      ))}
    </div>
  )
}
