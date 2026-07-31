import { useEffect } from 'react'
import { LogIn } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthProvider'
import { AuthLayout } from '../components/AuthLayout'

export function LoginPage() {
  const { login, register, authenticated, role } = useAuth()
  const navigate = useNavigate()

  useEffect(() => {
    if (authenticated) {
      if (role === 'admin') {
        navigate('/admin', { replace: true })
      } else {
        navigate('/vouchers', { replace: true })
      }
    }
  }, [authenticated, role, navigate])

  return (
    <AuthLayout
      eyebrow="Welcome Back"
      title="Đăng Nhập Tài Khoản"
      helper="Truy cập tài khoản để lưu voucher, theo dõi ưu đãi và claim nhanh hơn."
    >
      <button
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 text-base shadow-lg shadow-indigo-600/30 transition cursor-pointer"
        type="button"
        onClick={() => void login()}
      >
        <LogIn size={20} />
        Tiếp tục đăng nhập qua Keycloak
      </button>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-xs leading-relaxed text-slate-300">
        Bạn sẽ được chuyển sang trang đăng nhập bảo mật của PromoGuard. Sau khi đăng nhập thành công, hệ thống sẽ tự quay lại ứng dụng.
      </div>

      <p className="text-center text-xs text-slate-400 mt-2">
        Chưa có tài khoản?{' '}
        <button
          className="font-bold text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
          type="button"
          onClick={() => void register()}
        >
          Đăng ký ngay
        </button>
      </p>
    </AuthLayout>
  )
}
