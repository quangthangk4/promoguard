import { useEffect, useMemo, useState } from 'react'
import { Search, Loader2, Filter } from 'lucide-react'
import type { Role } from '../../auth'
import { VoucherGrid } from '../components/VoucherGrid'
import type { CampaignResponse, Voucher, CampaignStatus } from '../types'
import { mapCampaignToVoucher } from '../utils'
import api from '../../../shared/lib/api'

export function VoucherPage({ role }: { role: Role }) {
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | CampaignStatus>('ALL')
  const [vouchersList, setVouchersList] = useState<Voucher[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCampaigns = async () => {
    setLoading(true)
    try {
      const response = await api.get<{ data: CampaignResponse[] }>('/api/v1/campaigns')
      const mapped = (response.data.data || []).map(mapCampaignToVoucher)
      setVouchersList(mapped)
    } catch (err) {
      console.error('Failed to load campaigns', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const filteredVouchers = useMemo(() => {
    return vouchersList.filter((voucher) => {
      const matchesSearch = voucher.title.toLowerCase().includes(search.toLowerCase())
      const matchesStatus =
        statusFilter === 'ALL' || voucher.rawStatus === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [search, statusFilter, vouchersList])

  return (
    <div className="flex flex-col gap-8 py-4">
      {/* Header & Controls */}
      <div className="glass-panel flex flex-col gap-6 rounded-3xl p-6 sm:p-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 block mb-1">
            Voucher Catalog
          </span>
          <h1 className="text-3xl font-black text-white">Danh Sách Chiến Dịch Voucher</h1>
        </div>

        {/* Search & Filter bar */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              placeholder="Tìm kiếm chiến dịch voucher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-slate-700 bg-slate-900/80 pl-10 pr-4 py-3 text-sm text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none transition"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1.5 bg-slate-900/80 p-1.5 rounded-2xl border border-slate-800 self-start sm:self-auto">
            <span className="px-2 text-xs font-bold text-slate-400 flex items-center gap-1">
              <Filter size={14} />
              Trạng thái:
            </span>
            {(['ALL', 'ACTIVE', 'DRAFT', 'ENDED'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`rounded-xl px-3 py-1.5 text-xs font-bold transition cursor-pointer ${
                  statusFilter === st
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800'
                }`}
              >
                {st === 'ALL' ? 'Tất cả' : st}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid Content */}
      {loading ? (
        <div className="grid min-h-64 place-items-center">
          <Loader2 className="animate-spin text-indigo-400" size={36} />
        </div>
      ) : (
        <VoucherGrid vouchers={filteredVouchers} role={role} onClaimed={fetchCampaigns} />
      )}
    </div>
  )
}
