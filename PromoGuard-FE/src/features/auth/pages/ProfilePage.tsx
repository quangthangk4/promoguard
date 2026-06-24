import { BadgeCheck, Mail, ShieldCheck, UserRound } from 'lucide-react'
import type { ReactNode } from 'react'
import { useAuth } from '../AuthProvider'
import { AuthRequired } from '../../../shared/components/AuthRequired'
import { SectionHead } from '../../../shared/components/SectionHead'

export function ProfilePage() {
  const { authenticated, role, username } = useAuth()

  if (!authenticated) {
    return <AuthRequired title="Bạn cần đăng nhập để xem thông tin cá nhân." />
  }

  return (
    <section className="grid gap-5">
      <SectionHead eyebrow="Account" title="Thông tin cá nhân">
        <span className="badge badge-success gap-2 p-4 text-success-content">
          <BadgeCheck size={15} />
          Đã xác thực
        </span>
      </SectionHead>

      <div className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
        <article className="card overflow-hidden border border-white/70 bg-white shadow-xl shadow-slate-900/10">
          <div className="h-28 bg-gradient-to-br from-primary via-info to-success" />
          <div className="card-body -mt-12 items-center text-center">
            <div className="grid size-24 place-items-center rounded-3xl border-4 border-white bg-primary text-primary-content shadow-xl">
              <UserRound size={38} />
            </div>
            <h2 className="mt-2 text-2xl font-black">{username ?? 'PromoGuard User'}</h2>
            <p className="text-base-content/60">Tài khoản săn voucher PromoGuard</p>
            <span className="badge badge-primary mt-2 p-4 font-black uppercase">{role}</span>
          </div>
        </article>

        <article className="card border border-base-300 bg-base-100 shadow-sm">
          <div className="card-body gap-4">
            <div>
              <p className="text-xs font-black uppercase text-warning">Profile details</p>
              <h2 className="text-2xl font-black">Thông tin tài khoản</h2>
            </div>

            <div className="grid gap-3">
              <InfoRow
                icon={<UserRound size={19} />}
                label="Tên hiển thị"
                value={username ?? 'Chưa có thông tin'}
              />
              <InfoRow
                icon={<Mail size={19} />}
                label="Email"
                value={username?.includes('@') ? username : 'Lấy từ Keycloak token'}
              />
              <InfoRow icon={<ShieldCheck size={19} />} label="Vai trò" value={role.toUpperCase()} />
            </div>
          </div>
        </article>
      </div>
    </section>
  )
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: ReactNode
  label: string
  value: string
}) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-base-300 bg-base-100 p-4">
      <span className="grid size-10 place-items-center rounded-xl bg-info/15 text-info">{icon}</span>
      <div className="min-w-0">
        <p className="text-xs font-black uppercase text-base-content/45">{label}</p>
        <p className="truncate font-bold">{value}</p>
      </div>
    </div>
  )
}
