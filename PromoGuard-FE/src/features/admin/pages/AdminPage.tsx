import { useEffect, useState } from 'react'
import {
  ShieldCheck,
  PlusCircle,
  Trash2,
  Edit3,
  ToggleRight,
  Eye,
  BarChart3,
  Users,
  Loader2,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react'
import type { Role } from '../../auth'
import type { CampaignResponse, AdminClaimResponse, CampaignStatsResponse, CampaignStatus } from '../../vouchers/types'
import { rawStatusBadgeClass, formatDate, formatNumber } from '../../vouchers/utils'
import { AuthRequired } from '../../../shared/components/AuthRequired'
import api from '../../../shared/lib/api'

export function AdminPage({ role }: { role: Role }) {
  const [campaigns, setCampaigns] = useState<CampaignResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [errorMsg, setErrorMsg] = useState('')

  // Create Campaign Modal State
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createName, setCreateName] = useState('')
  const [createTotalQuantity, setCreateTotalQuantity] = useState(100)
  const [createStartTime, setCreateStartTime] = useState('')
  const [createEndTime, setCreateEndTime] = useState('')
  const [createStatus, setCreateStatus] = useState<CampaignStatus>('ACTIVE')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  // Edit Campaign Modal State
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editTotalQuantity, setEditTotalQuantity] = useState(100)
  const [editStartTime, setEditStartTime] = useState('')
  const [editEndTime, setEditEndTime] = useState('')
  const [editStatus, setEditStatus] = useState<CampaignStatus>('ACTIVE')
  const [editing, setEditing] = useState(false)
  const [editError, setEditError] = useState('')

  // Claims Audit & Stats Modal State
  const [showAuditModal, setShowAuditModal] = useState(false)
  const [auditStats, setAuditStats] = useState<CampaignStatsResponse | null>(null)
  const [auditClaims, setAuditClaims] = useState<AdminClaimResponse[]>([])
  const [auditLoading, setAuditLoading] = useState(false)

  // Status Toggling State
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const fetchCampaigns = async () => {
    setLoading(true)
    setErrorMsg('')
    try {
      const res = await api.get<{ data: CampaignResponse[] }>('/api/v1/campaigns')
      setCampaigns(res.data.data || [])
    } catch (err: any) {
      console.error(err)
      setErrorMsg(err.response?.data?.message || 'Không thể tải danh sách chiến dịch')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (role === 'admin') {
      fetchCampaigns()
    }
  }, [role])

  if (role !== 'admin') {
    return <AuthRequired title="Bạn không có quyền truy cập vào Khu Vực Quản Trị Admin." />
  }

  // Handle Create Campaign
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setCreateError('')

    try {
      const payload = {
        name: createName,
        totalQuantity: Number(createTotalQuantity),
        startTime: new Date(createStartTime).toISOString(),
        endTime: new Date(createEndTime).toISOString(),
        status: createStatus,
      }

      await api.post('/api/v1/campaigns', payload)
      setCreateName('')
      setCreateTotalQuantity(100)
      setCreateStartTime('')
      setCreateEndTime('')
      setCreateStatus('ACTIVE')
      setShowCreateModal(false)
      fetchCampaigns()
    } catch (err: any) {
      console.error(err)
      setCreateError(err.response?.data?.message || 'Lỗi khi tạo chiến dịch')
    } finally {
      setCreating(false)
    }
  }

  // Open Edit Modal
  const openEdit = (c: CampaignResponse) => {
    setEditingId(c.id)
    setEditName(c.name)
    setEditTotalQuantity(c.totalQuantity)
    setEditStartTime(c.startTime ? c.startTime.slice(0, 16) : '')
    setEditEndTime(c.endTime ? c.endTime.slice(0, 16) : '')
    setEditStatus(c.status)
    setEditError('')
    setShowEditModal(true)
  }

  // Handle Edit Submit
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingId) return
    setEditing(true)
    setEditError('')

    try {
      const payload = {
        name: editName,
        totalQuantity: Number(editTotalQuantity),
        startTime: new Date(editStartTime).toISOString(),
        endTime: new Date(editEndTime).toISOString(),
        status: editStatus,
      }

      await api.put(`/api/v1/campaigns/${editingId}`, payload)
      setShowEditModal(false)
      fetchCampaigns()
    } catch (err: any) {
      console.error(err)
      setEditError(err.response?.data?.message || 'Lỗi khi cập nhật chiến dịch')
    } finally {
      setEditing(false)
    }
  }

  // Handle Status Toggle (ACTIVE <-> ENDED or DRAFT -> ACTIVE)
  const handleToggleStatus = async (c: CampaignResponse) => {
    setTogglingId(c.id)
    const nextStatus: CampaignStatus = c.status === 'ACTIVE' ? 'ENDED' : 'ACTIVE'

    try {
      await api.patch(`/api/v1/campaigns/${c.id}/status?status=${nextStatus}`)
      fetchCampaigns()
    } catch (err) {
      console.error('Failed to update status', err)
    } finally {
      setTogglingId(null)
    }
  }

  // Handle Delete
  const handleDelete = async (id: string) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa chiến dịch này không?')) return

    try {
      await api.delete(`/api/v1/campaigns/${id}`)
      fetchCampaigns()
    } catch (err) {
      console.error('Failed to delete campaign', err)
    }
  }

  // Open Audit & Stats Modal
  const openAudit = async (id: string) => {
    setShowAuditModal(true)
    setAuditLoading(true)
    setAuditStats(null)
    setAuditClaims([])

    try {
      const [statsRes, claimsRes] = await Promise.all([
        api.get<{ data: CampaignStatsResponse }>(`/api/v1/campaigns/${id}/stats`),
        api.get<{ data: AdminClaimResponse[] }>(`/api/v1/campaigns/${id}/claims?limit=50`),
      ])
      setAuditStats(statsRes.data.data)
      setAuditClaims(claimsRes.data.data || [])
    } catch (err) {
      console.error('Failed to load audit logs', err)
    } finally {
      setAuditLoading(false)
    }
  }

  // Derived Summary Stats
  const totalCampaignsCount = campaigns.length
  const activeCount = campaigns.filter((c) => c.status === 'ACTIVE').length
  const totalClaimedCount = campaigns.reduce((acc, c) => acc + (c.totalQuantity - c.remainingQuantity), 0)

  return (
    <div className="flex flex-col gap-8 py-4">
      {/* Header Bar */}
      <div className="glass-panel flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-3xl p-6 sm:p-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block mb-1 flex items-center gap-1.5">
            <ShieldCheck size={16} />
            Admin Dashboard
          </span>
          <h1 className="text-3xl font-black text-white">Quản Lý Chiến Dịch Voucher</h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={fetchCampaigns}
            className="flex items-center gap-2 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-3 text-sm font-bold transition cursor-pointer"
            title="Tải lại danh sách"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Làm mới
          </button>

          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold px-5 py-3 text-sm shadow-lg shadow-amber-500/25 transition hover:scale-105 cursor-pointer"
          >
            <PlusCircle size={18} />
            Tạo Chiến Dịch Mới
          </button>
        </div>
      </div>

      {/* Metrics Overview Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="glass-panel flex items-center gap-4 rounded-3xl p-6 border border-slate-800">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <BarChart3 size={24} />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block">Tổng Chiến Dịch</span>
            <p className="text-2xl font-black text-white">{totalCampaignsCount}</p>
          </div>
        </div>

        <div className="glass-panel flex items-center gap-4 rounded-3xl p-6 border border-slate-800">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block">Đang Hoạt Động (Active)</span>
            <p className="text-2xl font-black text-emerald-400">{activeCount}</p>
          </div>
        </div>

        <div className="glass-panel flex items-center gap-4 rounded-3xl p-6 border border-slate-800">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400 border border-purple-500/20">
            <Users size={24} />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-400 block">Đã Được Săn (Claims)</span>
            <p className="text-2xl font-black text-purple-400">{formatNumber(totalClaimedCount)}</p>
          </div>
        </div>
      </div>

      {/* Campaign Management Table */}
      <div className="glass-panel overflow-hidden rounded-3xl border border-slate-800">
        <div className="p-6 border-b border-slate-800">
          <h2 className="text-xl font-bold text-white">Danh Sách Quản Lý Chiến Dịch</h2>
        </div>

        {loading ? (
          <div className="grid h-64 place-items-center">
            <Loader2 className="animate-spin text-amber-400" size={36} />
          </div>
        ) : errorMsg ? (
          <div className="p-8 text-center text-rose-400 font-semibold">{errorMsg}</div>
        ) : campaigns.length === 0 ? (
          <div className="p-12 text-center text-slate-400">Chưa có chiến dịch nào trong hệ thống.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-300">
              <thead className="bg-slate-900/80 text-xs font-bold uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="py-4 px-6">Tên Chiến Dịch</th>
                  <th className="py-4 px-6">Trạng Thái</th>
                  <th className="py-4 px-6">Số Lượng (Còn / Tổng)</th>
                  <th className="py-4 px-6">Thời Gian</th>
                  <th className="py-4 px-6 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {campaigns.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-4 px-6 font-bold text-white">
                      {c.name}
                      <span className="block text-[10px] font-mono text-slate-500 font-normal">{c.id}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center rounded-xl px-3 py-1 text-xs font-bold ${rawStatusBadgeClass(c.status)}`}>
                        {c.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 font-mono font-bold">
                      <span className="text-emerald-400">{formatNumber(c.remainingQuantity)}</span> /{' '}
                      <span className="text-slate-300">{formatNumber(c.totalQuantity)}</span>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-400 space-y-1">
                      <div>BD: {formatDate(c.startTime)}</div>
                      <div>KT: {formatDate(c.endTime)}</div>
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Audit / Claims button */}
                        <button
                          type="button"
                          onClick={() => openAudit(c.id)}
                          className="flex items-center gap-1 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 px-3 py-1.5 text-xs font-bold transition cursor-pointer"
                          title="Xem Audit Logs"
                        >
                          <Eye size={14} />
                          Audit
                        </button>

                        {/* Toggle Status */}
                        <button
                          type="button"
                          disabled={togglingId === c.id}
                          onClick={() => handleToggleStatus(c)}
                          className="flex items-center gap-1 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 px-3 py-1.5 text-xs font-bold transition cursor-pointer"
                          title="Đổi trạng thái Active/Ended"
                        >
                          {togglingId === c.id ? (
                            <Loader2 size={14} className="animate-spin" />
                          ) : (
                            <ToggleRight size={14} />
                          )}
                          Status
                        </button>

                        {/* Edit button */}
                        <button
                          type="button"
                          onClick={() => openEdit(c)}
                          className="flex items-center gap-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-3 py-1.5 text-xs font-bold transition cursor-pointer"
                          title="Chỉnh sửa"
                        >
                          <Edit3 size={14} />
                          Sửa
                        </button>

                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() => handleDelete(c.id)}
                          className="flex items-center gap-1 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 px-3 py-1.5 text-xs font-bold transition cursor-pointer"
                          title="Xóa chiến dịch"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* CREATE CAMPAIGN MODAL */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-700">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <PlusCircle className="text-amber-400" size={20} />
                Tạo Chiến Dịch Voucher Mới
              </h3>
              <button
                type="button"
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white font-bold p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreate} className="mt-4 flex flex-col gap-4 text-sm">
              {createError && (
                <div className="rounded-xl bg-rose-500/20 p-3 text-xs font-semibold text-rose-300 border border-rose-500/30">
                  {createError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Tên Chiến Dịch *</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Flash Sale 50% Off"
                  value={createName}
                  onChange={(e) => setCreateName(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Tổng Số Lượng Voucher *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={createTotalQuantity}
                  onChange={(e) => setCreateTotalQuantity(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Thời Gian Bắt Đầu *</label>
                  <input
                    type="datetime-local"
                    required
                    value={createStartTime}
                    onChange={(e) => setCreateStartTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-white focus:border-amber-500 focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Thời Gian Kết Thúc *</label>
                  <input
                    type="datetime-local"
                    required
                    value={createEndTime}
                    onChange={(e) => setCreateEndTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-white focus:border-amber-500 focus:outline-none text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Trạng Thái Ban Đầu *</label>
                <select
                  value={createStatus}
                  onChange={(e) => setCreateStatus(e.target.value as CampaignStatus)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-white focus:border-amber-500 focus:outline-none"
                >
                  <option value="ACTIVE">ACTIVE (Kích hoạt ngay)</option>
                  <option value="DRAFT">DRAFT (Bản nháp)</option>
                  <option value="ENDED">ENDED (Kết thúc)</option>
                </select>
              </div>

              <div className="mt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-xl bg-slate-800 px-4 py-2.5 font-bold text-slate-300 hover:bg-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5 transition cursor-pointer"
                >
                  {creating && <Loader2 size={16} className="animate-spin" />}
                  Tạo Mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CAMPAIGN MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel w-full max-w-lg rounded-3xl p-6 shadow-2xl border border-slate-700">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit3 className="text-amber-400" size={20} />
                Cập Nhật Chiến Dịch
              </h3>
              <button
                type="button"
                onClick={() => setShowEditModal(false)}
                className="text-slate-400 hover:text-white font-bold p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="mt-4 flex flex-col gap-4 text-sm">
              {editError && (
                <div className="rounded-xl bg-rose-500/20 p-3 text-xs font-semibold text-rose-300 border border-rose-500/30">
                  {editError}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Tên Chiến Dịch *</label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Tổng Số Lượng *</label>
                <input
                  type="number"
                  required
                  min={1}
                  value={editTotalQuantity}
                  onChange={(e) => setEditTotalQuantity(Number(e.target.value))}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-white focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Bắt Đầu *</label>
                  <input
                    type="datetime-local"
                    required
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-white focus:border-amber-500 focus:outline-none text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Kết Thúc *</label>
                  <input
                    type="datetime-local"
                    required
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                    className="w-full rounded-xl border border-slate-700 bg-slate-900 p-2.5 text-white focus:border-amber-500 focus:outline-none text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Trạng Thái *</label>
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value as CampaignStatus)}
                  className="w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-white focus:border-amber-500 focus:outline-none"
                >
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="DRAFT">DRAFT</option>
                  <option value="ENDED">ENDED</option>
                </select>
              </div>

              <div className="mt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="rounded-xl bg-slate-800 px-4 py-2.5 font-bold text-slate-300 hover:bg-slate-700"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={editing}
                  className="flex items-center gap-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-2.5 transition cursor-pointer"
                >
                  {editing && <Loader2 size={16} className="animate-spin" />}
                  Lưu Thay Đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AUDIT CLAIMS LOGS MODAL */}
      {showAuditModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="glass-panel w-full max-w-2xl max-h-[85vh] flex flex-col rounded-3xl p-6 shadow-2xl border border-slate-700">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 shrink-0">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Eye className="text-indigo-400" size={20} />
                Lịch Sử Săn Voucher (Audit Claims Log)
              </h3>
              <button
                type="button"
                onClick={() => setShowAuditModal(false)}
                className="text-slate-400 hover:text-white font-bold p-1 rounded-lg hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {auditLoading ? (
              <div className="grid h-64 place-items-center">
                <Loader2 className="animate-spin text-indigo-400" size={32} />
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto mt-4 space-y-4 pr-1">
                {auditStats && (
                  <div className="grid grid-cols-3 gap-3 bg-slate-900/80 p-4 rounded-2xl border border-slate-800 text-xs">
                    <div>
                      <span className="text-slate-400 block">Tên chiến dịch:</span>
                      <strong className="text-white font-bold text-sm truncate block">{auditStats.name}</strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Còn lại / Tổng:</span>
                      <strong className="text-emerald-400 font-bold text-sm">
                        {auditStats.remainingQuantity} / {auditStats.totalQuantity}
                      </strong>
                    </div>
                    <div>
                      <span className="text-slate-400 block">Lượt đã Săn:</span>
                      <strong className="text-purple-400 font-bold text-sm">{auditStats.claimedCount}</strong>
                    </div>
                  </div>
                )}

                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Danh sách User Claims ({auditClaims.length})
                </h4>

                {auditClaims.length === 0 ? (
                  <p className="py-8 text-center text-sm text-slate-400">Chưa có lượt claim nào cho chiến dịch này.</p>
                ) : (
                  <div className="space-y-2">
                    {auditClaims.map((claim) => (
                      <div
                        key={claim.id}
                        className="flex items-center justify-between bg-slate-900/60 p-3 rounded-2xl border border-slate-800 text-xs"
                      >
                        <div>
                          <span className="block font-mono text-indigo-300 font-semibold">User ID: {claim.userId}</span>
                          <span className="text-[10px] font-mono text-slate-500">Claim ID: {claim.id}</span>
                        </div>
                        <span className="font-mono text-slate-400 text-[11px]">{formatDate(claim.claimedAt)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="mt-6 flex justify-end shrink-0 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setShowAuditModal(false)}
                className="rounded-xl bg-slate-800 px-5 py-2.5 text-sm font-bold text-white hover:bg-slate-700"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
