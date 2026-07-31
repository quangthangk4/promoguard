import { useEffect } from 'react'
import { UserPlus } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../AuthProvider'
import { AuthLayout } from '../components/AuthLayout'

export function RegisterPage() {
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
      eyebrow="Create Account"
      title="Tạo Tài Khoản Mới"
      helper="Tạo tài khoản để nhận voucher nhanh hơn và lưu các ưu đãi yêu thích."
    >
      <button
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-3.5 text-base shadow-lg shadow-indigo-600/30 transition cursor-pointer"
        type="button"
        onClick={() => void register()}
      >
        <UserPlus size={20} />
        Tiếp tục đăng ký qua Keycloak
      </button>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 text-xs leading-relaxed text-slate-300">
        Tài khoản được tạo trên hệ thống xác thực của PromoGuard. Sau khi hoàn tất, bạn có thể đăng nhập và quay lại ứng dụng để claim voucher.
      </div>

      <p className="text-center text-xs text-slate-400 mt-2">
        Đã có tài khoản?{' '}
        <button
          className="font-bold text-indigo-400 hover:text-indigo-300 underline cursor-pointer"
          type="button"
          onClick={() => void login()}
        >
          Đăng nhập
        </button>
      </p>
    </AuthLayout>
  )
}
