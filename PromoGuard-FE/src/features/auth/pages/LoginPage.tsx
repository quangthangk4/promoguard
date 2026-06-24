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
      eyebrow="Welcome back"
      title="Đăng nhập"
      helper="Truy cập tài khoản để lưu voucher, theo dõi ưu đãi và claim nhanh hơn."
    >
      <button className="btn btn-primary h-12 text-base" type="button" onClick={() => void login()}>
        <LogIn size={18} />
        Tiếp tục đăng nhập
      </button>
      <p className="rounded-2xl bg-base-200 p-4 text-sm leading-relaxed text-base-content/65">
        Bạn sẽ được chuyển sang trang đăng nhập bảo mật của PromoGuard. Sau khi đăng nhập thành công,
        hệ thống tự quay lại ứng dụng.
      </p>
      <p className="text-center text-sm text-base-content/60">
        Chưa có tài khoản?{' '}
        <button
          className="link link-primary font-bold no-underline"
          type="button"
          onClick={() => void register()}
        >
          Đăng ký ngay
        </button>
      </p>
    </AuthLayout>
  )
}
