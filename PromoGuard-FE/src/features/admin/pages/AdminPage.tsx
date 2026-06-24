import { useEffect, useState } from 'react'
import {
  ShieldCheck,
  Trash2,
  Play,
  Square,
  PlusCircle,
  Loader2,
} from 'lucide-react'
import type { Role } from '../../auth'
import type { CampaignResponse, Voucher } from '../../vouchers/types'
import { mapCampaignToVoucher, formatNumber, remainingPercent, statusDotClass } from '../../vouchers/utils'
import { AuthRequired } from '../../../shared/components/AuthRequired'
import { SectionHead } from '../../../shared/components/SectionHead'
import type { EventItem } from '../types'
import { eventDotClass } from '../utils'
import api from '../../../shared/lib/api'

const mapOutboxToEvent = (msg: any): EventItem => {
  const date = new Date(msg.createdAt)
  const time = date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
  
  let payloadStr = msg.payload
  try {
    const obj = JSON.parse(msg.payload)
    payloadStr = JSON.stringify(obj)
  } catch (e) {
    // Raw
  }

  return {
    time,
    title: `${msg.eventType}`,
    detail: `Type: ${msg.aggregateType} [${msg.aggregateId}] • ${payloadStr}`,
    status: msg.status === 'PROCESSED' ? 'success' : 'pending',
  }
}

export function AdminPage({ role }: { role: Role }) {
  const [campaigns, setCampaigns] = useState<Voucher[]>([])
  const [eventsList, setEventsList] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)

  // Create campaign form state
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [name, setName] = useState('')
  const [totalQuantity, setTotalQuantity] = useState(100)
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [status, setStatus] = useState<'DRAFT' | 'ACTIVE' | 'ENDED'>('ACTIVE')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  // Edit campaign state
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingCampaignId, setEditingCampaignId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editTotalQuantity, setEditTotalQuantity] = useState(100)
  const [editStartTime, setEditStartTime] = useState('')
  const [editEndTime, setEditEndTime] = useState('')
  const [editStatus, setEditStatus] = useState<'DRAFT' | 'ACTIVE' | 'ENDED'>('ACTIVE')
  const [saving, setSaving] = useState(false)
  const [editError, setEditError] = useState('')

  // Claims modal state
  const [showClaimsModal, setShowClaimsModal] = useState(false)
  const [claimsCampaign, setClaimsCampaign] = useState<Voucher | null>(null)
  const [claimsList, setClaimsList] = useState<any[]>([])
  const [claimsStats, setClaimsStats] = useState<any | null>(null)
  const [claimsLoading, setClaimsLoading] = useState(false)

  const fetchCampaigns = async () => {
    try {
      const response = await api.get<{ data: CampaignResponse[] }>('/api/v1/campaigns')
      const mapped = (response.data.data || []).map(mapCampaignToVoucher)
      setCampaigns(mapped)
    } catch (err) {
      console.error('Failed to fetch campaigns', err)
    }
  }

  const fetchEvents = async () => {
    try {
      const response = await api.get<{ data: any[] }>('/api/v1/campaigns/events')
      const mapped = (response.data.data || []).map(mapOutboxToEvent)
      setEventsList(mapped)
    } catch (err) {
      console.error('Failed to fetch events', err)
    }
  }

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setCreateError('')

    try {
      const payload = {
        name,
        totalQuantity: Number(totalQuantity),
        startTime: new Date(startTime).toISOString(),
        endTime: new Date(endTime).toISOString(),
        status,
      }

      await api.post('/api/v1/campaigns', payload)
      setName('')
      setTotalQuantity(100)
      setStartTime('')
      setEndTime('')
      setStatus('ACTIVE')
      setShowCreateForm(false)
      fetchCampaigns()
    } catch (err: any) {
      console.error(err)
      setCreateError(err.response?.data?.message || 'Có lỗi xảy ra khi tạo chiến dịch')
    } finally {
      setCreating(false)
    }
  }

  const handleOpenEditModal = (voucher: Voucher) => {
    setEditingCampaignId(voucher.id)
    setEditName(voucher.title)
    setEditTotalQuantity(voucher.stock)
    void loadEditData(voucher.id)
  }

  const loadEditData = async (id: string) => {
    setShowEditModal(true)
    setEditError('')
    setSaving(true)
    try {
      const response = await api.get<{ data: CampaignResponse }>(`/api/v1/campaigns/${id}`)
      const c = response.data.data
      setEditName(c.name)
      setEditTotalQuantity(c.totalQuantity)
      setEditStatus(c.status)
      
      const startLocal = new Date(c.startTime)
      const offset = startLocal.getTimezoneOffset()
      const localStart = new Date(startLocal.getTime() - (offset * 60 * 1000)).toISOString().slice(0, 16)

      const endLocal = new Date(c.endTime)
      const localEnd = new Date(endLocal.getTime() - (offset * 60 * 1000)).toISOString().slice(0, 16)

      setEditStartTime(localStart)
      setEditEndTime(localEnd)
      setSaving(false)
    } catch (err) {
      console.error('Failed to load campaign for edit', err)
      setEditError('Không thể tải dữ liệu chiến dịch để chỉnh sửa')
      setSaving(false)
    }
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingCampaignId) return
    setSaving(true)
    setEditError('')

    try {
      const payload = {
        name: editName,
        totalQuantity: Number(editTotalQuantity),
        startTime: new Date(editStartTime).toISOString(),
        endTime: new Date(editEndTime).toISOString(),
        status: editStatus,
      }

      await api.put(`/api/v1/campaigns/${editingCampaignId}`, payload)
      setShowEditModal(false)
      fetchCampaigns()
      fetchEvents()
    } catch (err: any) {
      console.error(err)
      setEditError(err.response?.data?.message || 'Có lỗi xảy ra khi cập nhật chiến dịch')
    } finally {
      setSaving(false)
    }
  }

  const handleOpenClaimsModal = async (voucher: Voucher) => {
    setClaimsCampaign(voucher)
    setShowClaimsModal(true)
    setClaimsLoading(true)
    try {
      const statsResponse = await api.get<{ data: any }>(`/api/v1/campaigns/${voucher.id}/stats`)
      setClaimsStats(statsResponse.data.data)

      const claimsResponse = await api.get<{ data: any[] }>(`/api/v1/campaigns/${voucher.id}/claims`)
      setClaimsList(claimsResponse.data.data || [])
    } catch (err) {
      console.error('Failed to load campaign stats & claims', err)
    } finally {
      setClaimsLoading(false)
    }
  }

  const handleUpdateStatus = async (campaignId: string, newStatus: string) => {
    try {
      await api.patch(`/api/v1/campaigns/${campaignId}/status?status=${newStatus}`)
      fetchCampaigns()
      fetchEvents()
    } catch (err) {
      console.error('Failed to update campaign status', err)
    }
  }

  const handleDeleteCampaign = async (campaignId: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa chiến dịch này không?')) return
    try {
      await api.delete(`/api/v1/campaigns/${campaignId}`)
      fetchCampaigns()
      fetchEvents()
    } catch (err) {
      console.error('Failed to delete campaign', err)
    }
  }

  useEffect(() => {
    if (role !== 'admin') return

    const loadAll = async () => {
      setLoading(true)
      await Promise.all([fetchCampaigns(), fetchEvents()])
      setLoading(false)
    }

    loadAll()

    const timer = setInterval(() => {
      fetchCampaigns()
      fetchEvents()
    }, 5000)

    return () => clearInterval(timer)
  }, [role])

  if (role !== 'admin') {
    return <AuthRequired title="Chỉ admin mới truy cập được trang quản trị." />
  }

  return (
    <>
    <section className="grid gap-5">
      <SectionHead eyebrow="Admin role" title="Campaign control room">
        <span className="badge badge-success gap-2 p-4 text-success-content">
          <ShieldCheck size={15} />
          Zero oversell active
        </span>
      </SectionHead>



      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.15fr)_minmax(340px,0.85fr)]">
        <div className="card border border-base-300 bg-base-100 shadow-sm">
          <div className="card-body gap-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase text-warning">Inventory</p>
                <h2 className="text-2xl font-black">Campaign stock</h2>
              </div>
              <button
                className="btn btn-primary btn-sm rounded-full"
                type="button"
                onClick={() => setShowCreateForm(!showCreateForm)}
              >
                <PlusCircle size={17} />
                Tạo chiến dịch
              </button>
            </div>

            {showCreateForm && (
              <form onSubmit={handleCreateCampaign} className="rounded-xl border border-primary/20 bg-primary/5 p-4 grid gap-3">
                <h3 className="font-bold text-base-content">Tạo chiến dịch mới</h3>
                {createError && <p className="text-xs font-bold text-error">{createError}</p>}
                
                <div className="grid gap-2 sm:grid-cols-2">
                  <label className="form-control w-full">
                    <span className="label-text font-semibold mb-1">Tên chiến dịch</span>
                    <input
                      type="text"
                      placeholder="e.g. Summer Flash Voucher 40%"
                      className="input input-bordered input-sm"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </label>
                  <label className="form-control w-full">
                    <span className="label-text font-semibold mb-1">Số lượng voucher (Stock)</span>
                    <input
                      type="number"
                      min="1"
                      className="input input-bordered input-sm"
                      value={totalQuantity}
                      onChange={(e) => setTotalQuantity(Number(e.target.value))}
                      required
                    />
                  </label>
                  <label className="form-control w-full">
                    <span className="label-text font-semibold mb-1">Thời gian bắt đầu</span>
                    <input
                      type="datetime-local"
                      className="input input-bordered input-sm"
                      value={startTime}
                      onChange={(e) => setStartTime(e.target.value)}
                      required
                    />
                  </label>
                  <label className="form-control w-full">
                    <span className="label-text font-semibold mb-1">Thời gian kết thúc</span>
                    <input
                      type="datetime-local"
                      className="input input-bordered input-sm"
                      value={endTime}
                      onChange={(e) => setEndTime(e.target.value)}
                      required
                    />
                  </label>
                  <label className="form-control w-full">
                    <span className="label-text font-semibold mb-1">Trạng thái</span>
                    <select
                      className="select select-bordered select-sm w-full"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                    >
                      <option value="DRAFT">Nháp (DRAFT)</option>
                      <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                      <option value="ENDED">Kết thúc (ENDED)</option>
                    </select>
                  </label>
                </div>
                <div className="flex justify-end gap-2 mt-2">
                  <button className="btn btn-ghost btn-sm" type="button" onClick={() => setShowCreateForm(false)}>
                    Hủy
                  </button>
                  <button className="btn btn-primary btn-sm" type="submit" disabled={creating}>
                    {creating && <Loader2 className="animate-spin" size={14} />}
                    Lưu
                  </button>
                </div>
              </form>
            )}

            {loading ? (
              <div className="grid min-h-32 place-items-center">
                <Loader2 className="animate-spin text-primary" size={28} />
              </div>
            ) : campaigns.length === 0 ? (
              <p className="text-sm text-base-content/65 text-center py-6">Không có chiến dịch nào.</p>
            ) : (
              <div className="grid gap-3">
                {campaigns.map((voucher) => (
                  <div className="rounded-lg border border-base-300 bg-base-100 p-4" key={voucher.id}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <span className={`size-3 rounded-full ${statusDotClass(voucher.status)}`} />
                        <div className="min-w-0">
                          <strong className="block truncate">{voucher.title}</strong>
                          <span className="block truncate text-xs font-mono text-base-content/50">
                            {voucher.id}
                          </span>
                        </div>
                      </div>
                      <div className="text-left sm:text-right">
                        <strong className="block">{formatNumber(voucher.remaining)}</strong>
                        <span className="text-sm text-base-content/60">
                          of {formatNumber(voucher.stock)} left
                        </span>
                      </div>
                    </div>
                    <progress
                      className="progress progress-primary mt-3 h-2"
                      max="100"
                      value={remainingPercent(voucher)}
                    />
                    
                    <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-base-200">
                      <span className="text-xs text-base-content/50 font-semibold">
                        Trạng thái DB: <span className="font-bold text-primary">{voucher.rawStatus}</span>
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          className="btn btn-info btn-outline btn-xs gap-1"
                          type="button"
                          onClick={() => handleOpenClaimsModal(voucher)}
                        >
                          Lượt claim
                        </button>
                        {voucher.rawStatus !== 'ENDED' && (
                          <button
                            className="btn btn-neutral btn-xs gap-1"
                            type="button"
                            onClick={() => handleOpenEditModal(voucher)}
                          >
                            Sửa
                          </button>
                        )}
                        {voucher.rawStatus === 'DRAFT' && (
                          <button
                            className="btn btn-success btn-xs gap-1 text-success-content"
                            type="button"
                            onClick={() => handleUpdateStatus(voucher.id, 'ACTIVE')}
                          >
                            <Play size={12} />
                            Kích hoạt
                          </button>
                        )}
                        {voucher.rawStatus === 'ACTIVE' && (
                          <button
                            className="btn btn-warning btn-xs gap-1 text-warning-content"
                            type="button"
                            onClick={() => handleUpdateStatus(voucher.id, 'ENDED')}
                          >
                            <Square size={12} />
                            Kết thúc
                          </button>
                        )}
                        {(voucher.stock === voucher.remaining) && (
                          <button
                            className="btn btn-error btn-outline btn-xs gap-1"
                            type="button"
                            onClick={() => handleDeleteCampaign(voucher.id)}
                          >
                            <Trash2 size={12} />
                            Xóa
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="card border border-base-300 bg-base-100 shadow-sm">
          <div className="card-body gap-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-black uppercase text-warning">Kafka and outbox</p>
                <h2 className="text-2xl font-black">Event stream</h2>
              </div>
            </div>

            {loading ? (
              <div className="grid min-h-32 place-items-center">
                <Loader2 className="animate-spin text-primary" size={28} />
              </div>
            ) : eventsList.length === 0 ? (
              <p className="text-sm text-base-content/65 text-center py-6">Không có sự kiện outbox nào được ghi nhận.</p>
            ) : (
              <div className="grid gap-3 max-h-[500px] overflow-y-auto pr-1">
                {eventsList.map((event, idx) => (
                  <article
                    className="grid grid-cols-[auto_1fr] gap-3 border-b border-base-300 pb-3 last:border-b-0 last:pb-0"
                    key={`${event.time}-${idx}`}
                  >
                    <span className={`mt-2 size-3 rounded-full ${eventDotClass(event.status)}`} />
                    <div className="min-w-0">
                      <time className="text-xs font-black text-base-content/50">{event.time}</time>
                      <strong className="block text-sm truncate">{event.title}</strong>
                      <p className="text-xs text-base-content/60 break-all">{event.detail}</p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>

    {showEditModal && (
      <div className="modal modal-open z-50">
        <div className="modal-box max-w-lg bg-base-100 rounded-3xl p-6 relative">
          <button
            className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
            type="button"
            onClick={() => setShowEditModal(false)}
          >
            ✕
          </button>
          <h3 className="font-black text-2xl text-base-content mb-4">Chỉnh sửa chiến dịch</h3>
          {editError && <p className="text-xs font-bold text-error mb-3">{editError}</p>}

          <form onSubmit={handleSaveEdit} className="grid gap-3">
            <label className="form-control w-full">
              <span className="label-text font-semibold mb-1">Tên chiến dịch</span>
              <input
                type="text"
                className="input input-bordered input-sm"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
                disabled={saving}
              />
            </label>
            <label className="form-control w-full">
              <span className="label-text font-semibold mb-1">Số lượng voucher (Stock)</span>
              <input
                type="number"
                min="1"
                className="input input-bordered input-sm"
                value={editTotalQuantity}
                onChange={(e) => setEditTotalQuantity(Number(e.target.value))}
                required
                disabled={saving}
              />
            </label>
            <div className="grid grid-cols-2 gap-3">
              <label className="form-control w-full">
                <span className="label-text font-semibold mb-1">Thời gian bắt đầu</span>
                <input
                  type="datetime-local"
                  className="input input-bordered input-sm"
                  value={editStartTime}
                  onChange={(e) => setEditStartTime(e.target.value)}
                  required
                  disabled={saving}
                />
              </label>
              <label className="form-control w-full">
                <span className="label-text font-semibold mb-1">Thời gian kết thúc</span>
                <input
                  type="datetime-local"
                  className="input input-bordered input-sm"
                  value={editEndTime}
                  onChange={(e) => setEditEndTime(e.target.value)}
                  required
                  disabled={saving}
                />
              </label>
            </div>
            <label className="form-control w-full">
              <span className="label-text font-semibold mb-1">Trạng thái</span>
              <select
                className="select select-bordered select-sm w-full"
                value={editStatus}
                onChange={(e) => setEditStatus(e.target.value as any)}
                disabled={saving}
              >
                <option value="DRAFT">Nháp (DRAFT)</option>
                <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                <option value="ENDED">Kết thúc (ENDED)</option>
              </select>
            </label>
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="btn btn-ghost btn-sm"
                type="button"
                onClick={() => setShowEditModal(false)}
                disabled={saving}
              >
                Hủy
              </button>
              <button className="btn btn-primary btn-sm" type="submit" disabled={saving}>
                {saving && <Loader2 className="animate-spin" size={14} />}
                Lưu thay đổi
              </button>
            </div>
          </form>
        </div>
      </div>
    )}

    {showClaimsModal && claimsCampaign && (
      <div className="modal modal-open z-50">
        <div className="modal-box max-w-2xl bg-base-100 rounded-3xl p-6 relative">
          <button
            className="btn btn-sm btn-circle btn-ghost absolute right-4 top-4"
            type="button"
            onClick={() => {
              setShowClaimsModal(false)
              setClaimsCampaign(null)
              setClaimsStats(null)
              setClaimsList([])
            }}
          >
            ✕
          </button>
          <h3 className="font-black text-2xl text-base-content mb-2">Thống kê & Lượt claim</h3>
          <p className="text-sm text-base-content/60 mb-4">Chiến dịch: <span className="font-bold text-primary">{claimsCampaign.title}</span></p>

          {claimsLoading ? (
            <div className="grid h-48 place-items-center">
              <Loader2 className="animate-spin text-primary" size={28} />
            </div>
          ) : (
            <div className="grid gap-6">
              {claimsStats && (
                <div className="grid grid-cols-3 gap-3 bg-base-200 p-4 rounded-2xl text-center">
                  <div>
                    <span className="text-[10px] font-black uppercase text-base-content/45 block">Tổng phát hành</span>
                    <strong className="text-base text-base-content font-bold">{formatNumber(claimsStats.totalQuantity)}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-base-content/45 block">Đã claim</span>
                    <strong className="text-base text-primary font-bold">{formatNumber(claimsStats.claimedCount)}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] font-black uppercase text-base-content/45 block">Còn lại trong kho</span>
                    <strong className="text-base text-success font-bold">{formatNumber(claimsStats.remainingQuantity)}</strong>
                  </div>
                </div>
              )}

              <div>
                <h4 className="font-black text-base-content mb-2 uppercase text-xs tracking-wider">Danh sách tài khoản đã claim ({claimsList.length})</h4>
                {claimsList.length === 0 ? (
                  <p className="text-sm text-base-content/50 py-6 text-center border border-dashed border-base-300 rounded-2xl">
                    Chưa có lượt claim nào được ghi nhận.
                  </p>
                ) : (
                  <div className="max-h-64 overflow-y-auto border border-base-200 rounded-2xl">
                    <table className="table table-xs w-full">
                      <thead>
                        <tr>
                          <th>Mã lượt claim</th>
                          <th>Mã User ID (Keycloak)</th>
                          <th>Thời gian claim</th>
                        </tr>
                      </thead>
                      <tbody>
                        {claimsList.map((claim) => (
                          <tr key={claim.id}>
                            <td className="font-mono text-[10px] select-all">{claim.id}</td>
                            <td className="font-mono text-[10px] select-all">{claim.userId}</td>
                            <td className="text-[11px] font-semibold">
                              {new Date(claim.claimedAt).toLocaleString('vi-VN')}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    )}
  </>
  )
}
