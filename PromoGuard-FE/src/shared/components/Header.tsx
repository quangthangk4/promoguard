import { LogIn, LogOut, Menu, ShieldCheck, UserPlus, X } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { type Role, useAuth } from '../../features/auth'

function roleBadgeClass(role: Role) {
  switch (role) {
    case 'admin':
      return 'bg-amber-500/20 text-amber-300 border border-amber-500/40 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider'
    case 'user':
      return 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider'
    default:
      return 'bg-slate-700/50 text-slate-300 border border-slate-600 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider'
  }
}

export function Header({
  menuOpen,
  role,
  setMenuOpen,
}: {
  menuOpen: boolean
  role: Role
  setMenuOpen: (value: boolean) => void
}) {
  const { logout } = useAuth()

  const navItems = [
    { to: '/', label: 'Trang chủ' },
    { to: '/vouchers', label: 'Voucher Catalog' },
    ...(role !== 'guest' ? [{ to: '/user/vouchers', label: 'Voucher của tôi' }] : []),
    ...(role !== 'guest' ? [{ to: '/profile', label: 'Hồ sơ' }] : []),
    ...(role === 'admin' ? [{ to: '/admin', label: 'Quản trị' }] : []),
  ]

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800 bg-slate-900/80 backdrop-blur-xl transition-all">
      <div className="mx-auto flex h-20 w-[min(1280px,calc(100%-2rem))] items-center justify-between">
        {/* Brand Logo */}
        <Link className="flex items-center gap-3 no-underline group" to="/">
          <div className="flex size-11 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-600 to-emerald-500 text-white shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
            <ShieldCheck size={24} />
          </div>
          <div>
            <strong className="block text-xl font-black tracking-tight text-white group-hover:text-indigo-400 transition-colors">
              PromoGuard
            </strong>
            <span className="block text-xs font-medium text-slate-400">
              High-Throughput Voucher Engine
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1 bg-slate-800/40 p-1.5 rounded-2xl border border-slate-700/50">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `px-4 py-2 text-sm font-semibold rounded-xl transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white shadow-md shadow-indigo-500/20'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* Right Actions & Auth */}
        <div className="flex items-center gap-3">
          {role !== 'guest' && <span className={roleBadgeClass(role)}>{role}</span>}

          <div className="hidden sm:flex items-center gap-2">
            {role === 'guest' ? (
              <>
                <Link
                  className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold text-slate-300 hover:bg-slate-800 hover:text-white transition"
                  to="/login"
                >
                  <LogIn size={18} />
                  Đăng nhập
                </Link>
                <Link
                  className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 text-sm font-bold shadow-lg shadow-indigo-600/30 transition hover:shadow-indigo-500/40"
                  to="/register"
                >
                  <UserPlus size={18} />
                  Đăng ký
                </Link>
              </>
            ) : (
              <button
                className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 px-4 py-2 text-sm font-bold transition cursor-pointer"
                type="button"
                onClick={() => void logout()}
              >
                <LogOut size={18} />
                Đăng xuất
              </button>
            )}
          </div>

          {/* Mobile menu toggle */}
          <button
            className="flex size-10 items-center justify-center rounded-xl border border-slate-700 bg-slate-800/60 text-slate-300 lg:hidden hover:bg-slate-800 hover:text-white"
            type="button"
            aria-label="Toggle navigation"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="border-b border-slate-800 bg-slate-900/95 p-4 lg:hidden backdrop-blur-2xl">
          <nav className="flex flex-col gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                onClick={() => setMenuOpen(false)}
                className={({ isActive }) =>
                  `px-4 py-3 text-sm font-bold rounded-xl transition-all ${
                    isActive
                      ? 'bg-indigo-600 text-white'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-4 pt-4 border-t border-slate-800 flex flex-col gap-2">
            {role === 'guest' ? (
              <>
                <Link
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-800 py-2.5 font-bold text-white"
                  to="/login"
                  onClick={() => setMenuOpen(false)}
                >
                  <LogIn size={18} />
                  Đăng nhập
                </Link>
                <Link
                  className="flex items-center justify-center gap-2 rounded-xl bg-indigo-600 py-2.5 font-bold text-white"
                  to="/register"
                  onClick={() => setMenuOpen(false)}
                >
                  <UserPlus size={18} />
                  Đăng ký
                </Link>
              </>
            ) : (
              <button
                className="flex items-center justify-center gap-2 rounded-xl bg-rose-600/20 text-rose-300 border border-rose-500/30 py-2.5 font-bold"
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  void logout()
                }}
              >
                <LogOut size={18} />
                Đăng xuất
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
