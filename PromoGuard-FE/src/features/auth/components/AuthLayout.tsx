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
      <div className="glass-panel grid w-full max-w-5xl overflow-hidden rounded-3xl border border-slate-800 shadow-2xl lg:grid-cols-[1.05fr_0.95fr]">
        {/* Left Side Banner */}
        <div className="relative hidden min-h-[620px] overflow-hidden bg-slate-900/90 p-8 text-white lg:block border-r border-slate-800">
          <div className="hero-signal absolute inset-0 opacity-40" />
          <div className="relative z-10 flex h-full flex-col justify-between">
            <Link className="flex items-center gap-3 text-white no-underline group" to="/">
              <span className="flex size-11 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/30">
                <ShieldCheck size={22} />
              </span>
              <span>
                <strong className="block text-lg font-black text-white">PromoGuard</strong>
                <small className="text-slate-400">Flash Sale Reservation Platform</small>
              </span>
            </Link>

            <div className="space-y-6">
              <div className="max-w-sm">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 block mb-2">
                  High-Throughput Protection
                </span>
                <h2 className="text-3xl font-black leading-tight text-white">
                  Săn Voucher Tốc Độ Cao, Không Lo Trùng Lặp.
                </h2>
                <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                  Tự động lưu trữ thông tin voucher đã nhận, bảo vệ tài khoản với mã hóa Keycloak OAuth2 chuẩn doanh nghiệp.
                </p>
              </div>

              <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-xs">
                <div className="flex items-center justify-between text-slate-400 mb-1">
                  <span>Hệ thống bảo vệ</span>
                  <span className="text-emerald-400 font-bold">ACTIVE</span>
                </div>
                <div className="font-mono text-indigo-300 font-bold text-sm">PROMO-GUARD-OAUTH2-OK</div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side Form */}
        <div className="grid place-items-center p-6 sm:p-10 lg:p-12">
          <div className="w-full max-w-md">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 mb-4 shadow-lg shadow-indigo-600/20">
              <LockKeyhole size={24} />
            </span>
            <div>
              <span className="text-xs font-bold uppercase text-indigo-400 block mb-1">{eyebrow}</span>
              <h1 className="text-3xl font-black leading-tight text-white">{title}</h1>
              <p className="mt-2 text-sm text-slate-300 leading-relaxed">{helper}</p>
            </div>
            <div className="mt-8 flex flex-col gap-4">{children}</div>
          </div>
        </div>
      </div>
    </section>
  )
}
