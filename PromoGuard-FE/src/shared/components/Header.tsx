import { LogIn, LogOut, Menu, ShieldCheck, UserPlus, X } from 'lucide-react'
import { Link, NavLink } from 'react-router-dom'
import { type Role, useAuth } from '../../features/auth'

function roleBadgeClass(role: Role) {
  const classes = {
    admin: 'badge badge-warning p-3 font-black uppercase',
    guest: 'badge badge-info p-3 font-black uppercase',
    user: 'badge badge-success p-3 font-black uppercase text-success-content',
  }

  return classes[role]
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
    { to: '/vouchers', label: 'Voucher' },
    ...(role !== 'guest' ? [{ to: '/user/vouchers', label: 'Voucher của tôi' }] : []),
    ...(role !== 'guest' ? [{ to: '/profile', label: 'Hồ sơ' }] : []),
    ...(role === 'admin' ? [{ to: '/admin', label: 'Admin' }] : []),
  ]

  return (
    <header className="sticky top-0 z-30 border-b border-white/60 bg-white/80 shadow-sm backdrop-blur-xl">
      <div className="navbar mx-auto min-h-18 w-[min(1180px,calc(100%-1.5rem))] px-0 sm:w-[min(1180px,calc(100%-2.25rem))]">
        <div className="navbar-start">
          <Link className="flex items-center gap-3 text-base-content no-underline" to="/">
            <span className="grid size-11 place-items-center rounded-lg bg-primary text-primary-content">
              <ShieldCheck size={22} />
            </span>
            <span>
              <strong className="block text-lg leading-tight">PromoGuard</strong>
              <small className="block text-xs text-base-content/60">
                Flash sale reservation
              </small>
            </span>
          </Link>
        </div>

        <div className="navbar-center hidden lg:flex">
          <nav className="menu menu-horizontal gap-1 px-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  className={({ isActive }) =>
                    `rounded-lg font-bold ${isActive ? 'bg-base-200 text-base-content' : ''}`
                  }
                  to={item.to}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </nav>
        </div>

        <div className="navbar-end gap-2">
          {role !== 'guest' && <span className={roleBadgeClass(role)}>{role}</span>}
          <div className="hidden gap-2 sm:flex">
            {role === 'guest' ? (
              <>
                <Link className="btn btn-ghost btn-sm" to="/login">
                  <LogIn size={17} />
                  Đăng nhập
                </Link>
                <Link className="btn btn-primary btn-sm" to="/register">
                  <UserPlus size={17} />
                  Đăng ký
                </Link>
              </>
            ) : (
              <button
                className="btn btn-ghost btn-sm"
                type="button"
                onClick={() => void logout()}
              >
                <LogOut size={17} />
                Đăng xuất
              </button>
            )}
          </div>
          <button
            className="btn btn-square btn-ghost lg:hidden"
            type="button"
            aria-label="Toggle navigation"
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-base-300 bg-base-100 p-3 lg:hidden">
          <nav className="menu gap-1">
            {navItems.map((item) => (
              <li key={item.to}>
                <NavLink
                  className={({ isActive }) =>
                    `rounded-lg font-bold ${isActive ? 'active' : ''}`
                  }
                  onClick={() => setMenuOpen(false)}
                  to={item.to}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </nav>
          <div className="mt-3 grid gap-2 sm:hidden">
            {role === 'guest' ? (
              <>
                <Link className="btn btn-outline btn-sm" to="/login">
                  <LogIn size={17} />
                  Đăng nhập
                </Link>
                <Link className="btn btn-primary btn-sm" to="/register">
                  <UserPlus size={17} />
                  Đăng ký
                </Link>
              </>
            ) : (
              <button
                className="btn btn-outline btn-sm"
                type="button"
                onClick={() => {
                  setMenuOpen(false)
                  void logout()
                }}
              >
                <LogOut size={17} />
                Đăng xuất
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
