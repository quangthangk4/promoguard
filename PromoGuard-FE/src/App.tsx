import { useState } from 'react'
import { Route, Routes } from 'react-router-dom'
import { AdminPage } from './features/admin/pages/AdminPage'
import { LoginPage } from './features/auth/pages/LoginPage'
import { ProfilePage } from './features/auth/pages/ProfilePage'
import { RegisterPage } from './features/auth/pages/RegisterPage'
import { useAuth } from './features/auth'
import { UserVoucherPage } from './features/vouchers/pages/UserVoucherPage'
import { VoucherPage } from './features/vouchers/pages/VoucherPage'
import { HomePage } from './pages/HomePage'
import { Header } from './shared/components/Header'
import { PromoBackground } from './shared/components/PromoBackground'

function App() {
  const { initialized, role } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  if (!initialized) {
    return (
      <div className="grid min-h-screen place-items-center bg-[#eef4f8]" data-theme="corporate">
        <span className="loading loading-spinner loading-lg text-primary" />
      </div>
    )
  }

  return (
    <div
      className="relative isolate min-h-screen overflow-hidden bg-[#eef4f8] text-base-content"
      data-theme="corporate"
    >
      <PromoBackground />
      <Header menuOpen={menuOpen} role={role} setMenuOpen={setMenuOpen} />
      <main className="relative z-10 mx-auto w-[min(1180px,calc(100%-1.5rem))] py-6 sm:w-[min(1180px,calc(100%-2.25rem))] lg:py-8">
        <Routes>
          <Route path="/" element={<HomePage role={role} />} />
          <Route path="/vouchers" element={<VoucherPage role={role} />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/user/vouchers" element={<UserVoucherPage role={role} />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminPage role={role} />} />
        </Routes>
      </main>
    </div>
  )
}

export default App
