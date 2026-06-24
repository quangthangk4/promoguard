import type { ReactNode } from 'react'
import { LockKeyhole, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

export function AuthLayout({
  children,
  eyebrow,
  helper,
  title,
}: {
  children: ReactNode
  eyebrow: string
  helper: string
  title: string
}) {
  return (
    <section className="grid min-h-[calc(100vh-9rem)] place-items-center py-8">
      <div className="grid w-full max-w-5xl overflow-hidden rounded-3xl border border-white/70 bg-white/85 shadow-2xl shadow-slate-900/15 backdrop-blur-xl lg:grid-cols-[1.05fr_0.95fr]">
        <div className="relative hidden min-h-[620px] overflow-hidden bg-slate-950 p-8 text-white lg:block">
          <div className="hero-signal absolute inset-0 opacity-80" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_20%,rgba(16,185,129,0.45),transparent_32%),radial-gradient(circle_at_82%_12%,rgba(59,130,246,0.34),transparent_34%),linear-gradient(180deg,rgba(15,23,42,0.08),rgba(15,23,42,0.88))]" />
          <div className="relative z-10 flex h-full flex-col justify-between">
            <Link className="flex items-center gap-3 text-white no-underline" to="/">
              <span className="grid size-11 place-items-center rounded-xl bg-white/15 backdrop-blur">
                <ShieldCheck size={22} />
              </span>
              <span>
                <strong className="block text-lg">PromoGuard</strong>
                <small className="text-white/60">Voucher claim platform</small>
              </span>
            </Link>

            <div className="space-y-5">
              <div className="max-w-sm">
                <p className="text-sm font-black uppercase tracking-wide text-emerald-300">
                  Flash sale ready
                </p>
                <h2 className="mt-2 text-4xl font-black leading-tight">
                  Claim voucher nhanh, mọi ưu đãi trong một tài khoản.
                </h2>
                <p className="mt-4 text-white/65">
                  Theo dõi voucher đang mở, lưu mã đã nhận và quay lại săn deal chỉ trong vài giây.
                </p>
              </div>

              <div className="grid gap-3">
                <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/60">Summer Flash Voucher</span>
                    <span className="badge badge-success text-success-content">Live</span>
                  </div>
                  <div className="mt-3 flex items-end justify-between">
                    <strong className="text-3xl">40% off</strong>
                    <span className="text-sm text-white/60">347 left</span>
                  </div>
                  <progress className="progress progress-success mt-4 h-2" max="100" value="34" />
                </div>

                <div className="ml-12 rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-white/60">Lunch Rush Coupon</span>
                    <span className="text-sm font-bold text-emerald-300">Claimed</span>
                  </div>
                  <div className="mt-3 font-mono text-lg tracking-wider">LUNCH-A81Q</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid place-items-center p-5 sm:p-8 lg:p-12">
          <div className="w-full max-w-md">
            <span className="grid size-12 place-items-center rounded-2xl bg-primary text-primary-content shadow-lg shadow-primary/20">
              <LockKeyhole size={23} />
            </span>
            <div>
              <p className="text-xs font-black uppercase text-primary">{eyebrow}</p>
              <h1 className="mt-2 text-4xl font-black leading-tight">{title}</h1>
              <p className="mt-2 text-base-content/60">{helper}</p>
            </div>
            <div className="mt-7 grid gap-3">{children}</div>
          </div>
        </div>
      </div>
    </section>
  )
}
