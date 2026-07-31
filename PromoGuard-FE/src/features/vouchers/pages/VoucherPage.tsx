import { useEffect, useMemo, useState } from 'react'
import { Search, Loader2, Sparkles } from 'lucide-react'
import type { Role } from '../../auth'
import { VoucherGrid } from '../components/VoucherGrid'
import type { CampaignResponse, Voucher } from '../types'
import { mapCampaignToVoucher } from '../utils'
import api from '../../../shared/lib/api'

export function VoucherPage({ role }: { role: Role }) {
  const [search, setSearch] = useState('')
  const [vouchersList, setVouchersList] = useState<Voucher[]>([])
  const [loading, setLoading] = useState(true)

  const fetchCampaigns = async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      const response = await api.get<{ data: CampaignResponse[] }>('/api/v1/campaigns?status=ACTIVE')
      const mapped = (response.data.data || [])
        .map(mapCampaignToVoucher)
        .filter((v) => v.status === 'Active')
      setVouchersList(mapped)
    } catch (err) {
      console.error('Failed to load campaigns', err)
    } finally {
      if (!silent) setLoading(false)
    }
  }

  useEffect(() => {
    fetchCampaigns()
  }, [])

  const filteredVouchers = useMemo(() => {
    return vouchersList.filter((voucher) =>
      voucher.title.toLowerCase().includes(search.toLowerCase())
    )
  }, [search, vouchersList])

  return (
    <div className="flex flex-col gap-8 py-4">
      {/* Header & Search */}
      <div className="glass-panel flex flex-col gap-6 rounded-3xl p-6 sm:p-8">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 block mb-1">
              Public Catalog
            </span>
            <h1 className="text-3xl font-black text-white">Danh Sách Chiến Dịch Voucher Đang Mở</h1>
          </div>
          <span className="hidden sm:flex items-center gap-1.5 rounded-2xl bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-400 border border-emerald-500/20">
            <Sparkles size={16} />
            {filteredVouchers.length} Chiến dịch khả dụng
          </span>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="text"
            placeholder="Tìm kiếm voucher theo tên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-2xl border border-slate-700 bg-slate-900/80 pl-10 pr-4 py-3 text-sm text-white placeholder-slate-400 focus:border-indigo-500 focus:outline-none transition"
          />
        </div>
      </div>

      {/* Grid Content */}
      {loading ? (
        <div className="grid min-h-64 place-items-center">
          <Loader2 className="animate-spin text-indigo-400" size={36} />
        </div>
      ) : (
        <VoucherGrid vouchers={filteredVouchers} role={role} onClaimed={() => fetchCampaigns(true)} />
      )}
    </div>
  )
}
