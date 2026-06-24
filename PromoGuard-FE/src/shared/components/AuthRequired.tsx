import { KeyRound, LogIn, UserPlus } from 'lucide-react'
import { Link } from 'react-router-dom'

export function AuthRequired({ title }: { title: string }) {
  return (
    <section className="card mx-auto mt-16 w-full max-w-2xl border border-base-300 bg-base-100 shadow-sm">
      <div className="card-body items-start">
        <span className="grid size-12 place-items-center rounded-lg bg-primary text-primary-content">
          <KeyRound size={23} />
        </span>
        <h1 className="text-3xl font-black">{title}</h1>
        <p className="text-base-content/60">Hãy đăng nhập bằng user hoặc admin role để tiếp tục.</p>
        <div className="card-actions mt-2">
          <Link className="btn btn-primary" to="/login">
            <LogIn size={18} />
            Đăng nhập
          </Link>
          <Link className="btn btn-outline" to="/register">
            <UserPlus size={18} />
            Đăng ký
          </Link>
        </div>
      </div>
    </section>
  )
}
