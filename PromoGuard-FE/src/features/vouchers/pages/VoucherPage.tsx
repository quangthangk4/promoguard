import { useEffect, useMemo, useState } from 'react'
import { Search, Loader2 } from 'lucide-react'
import type { Role } from '../../auth'
import { SectionHead } from '../../../shared/components/SectionHead'
import { VoucherGrid } from '../components/VoucherGrid'
import type { CampaignResponse, Voucher } from '../types'
import { mapCampaignToVoucher } from '../utils'
import api from '../../../shared/lib/api'

export function VoucherPage({ role }: { role: Role }) {
  const [search, setSearch] = useState('')
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

  const filteredVouchers = useMemo(
    () =>
      vouchersList.filter((voucher) =>
        `${voucher.title} ${voucher.merchant} ${voucher.category}`
          .toLowerCase()
          .includes(search.toLowerCase()),
      ),
    [search, vouchersList],
  )

  return (
    <section className="grid gap-5">
      <SectionHead eyebrow="Public catalog" title="Danh sách voucher">
        <label className="input input-bordered flex w-full items-center gap-2 sm:w-96">
          <Search size={18} />
          <input
            placeholder="Tìm voucher, thương hiệu, danh mục"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </SectionHead>
      
      {loading ? (
        <div className="grid min-h-64 place-items-center">
          <Loader2 className="animate-spin text-primary" size={32} />
        </div>
      ) : (
        <VoucherGrid vouchers={filteredVouchers} role={role} />
      )}
    </section>
  )
}
