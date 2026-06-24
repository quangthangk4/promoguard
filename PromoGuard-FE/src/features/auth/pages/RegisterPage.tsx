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
      eyebrow="Create account"
      title="Tạo tài khoản"
      helper="Tạo tài khoản để nhận voucher nhanh hơn và lưu các ưu đãi yêu thích."
    >
      <button
        className="btn btn-primary h-12 text-base"
        type="button"
        onClick={() => void register()}
      >
        <UserPlus size={18} />
        Tiếp tục đăng ký
      </button>
      <p className="rounded-2xl bg-base-200 p-4 text-sm leading-relaxed text-base-content/65">
        Tài khoản được tạo trên hệ thống xác thực của PromoGuard. Sau khi hoàn tất,
        bạn có thể đăng nhập và quay lại ứng dụng để claim voucher.
      </p>
      <p className="text-center text-sm text-base-content/60">
        Đã có tài khoản?{' '}
        <button
          className="link link-primary font-bold no-underline"
          type="button"
          onClick={() => void login()}
        >
          Đăng nhập
        </button>
      </p>
    </AuthLayout>
  )
}
