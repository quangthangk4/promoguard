import { BadgeCheck, Mail, ShieldCheck, UserRound } from 'lucide-react'
import type { ReactNode } from 'react'
import { useAuth } from '../AuthProvider'
import { AuthRequired } from '../../../shared/components/AuthRequired'

export function ProfilePage() {
  const { authenticated, role, username } = useAuth()

  if (!authenticated) {
    return <AuthRequired title="Bạn cần đăng nhập để xem thông tin cá nhân." />
  }

  return (
    <div className="flex flex-col gap-8 py-4">
      <div className="glass-panel flex items-center justify-between rounded-3xl p-6 sm:p-8">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-400 block mb-1">
            Account Details
          </span>
          <h1 className="text-3xl font-black text-white">Hồ Sơ Cá Nhân</h1>
        </div>
        <span className="flex items-center gap-2 rounded-2xl bg-emerald-500/10 px-4 py-2 text-xs font-bold text-emerald-400 border border-emerald-500/20">
          <BadgeCheck size={16} />
          Đã xác thực Keycloak
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr]">
        <article className="glass-panel overflow-hidden rounded-3xl border border-slate-800 p-6 flex flex-col items-center text-center">
          <div className="flex size-24 items-center justify-center rounded-3xl bg-gradient-to-tr from-indigo-600 to-emerald-500 text-white shadow-xl shadow-indigo-600/30 mb-4">
            <UserRound size={44} />
          </div>
          <h2 className="text-2xl font-black text-white">{username ?? 'PromoGuard User'}</h2>
          <p className="text-sm text-slate-400 mt-1">Tài khoản săn voucher PromoGuard</p>
          <span className="mt-4 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 px-4 py-1 text-xs font-bold uppercase tracking-wider">
            Role: {role}
          </span>
        </article>

        <article className="glass-panel rounded-3xl border border-slate-800 p-6 flex flex-col gap-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 block mb-1">
              Account Attributes
            </span>
            <h2 className="text-xl font-bold text-white">Thông Tin Chi Tiết</h2>
          </div>

          <div className="flex flex-col gap-3">
            <InfoRow
              icon={<UserRound size={20} />}
              label="Tên tài khoản"
              value={username ?? 'Chưa có thông tin'}
            />
            <InfoRow
              icon={<Mail size={20} />}
              label="Email"
              value={username?.includes('@') ? username : 'Lấy từ Keycloak Token'}
            />
            <InfoRow
              icon={<ShieldCheck size={20} />}
              label="Quyền hạn (Role)"
              value={role.toUpperCase()}
            />
          </div>
        </article>
      </div>
    </div>
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
    <div className="flex items-center gap-4 rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
      <span className="flex size-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="truncate font-bold text-slate-100 text-sm">{value}</p>
      </div>
    </div>
  )
}
