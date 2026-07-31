import { KeyRound, LogIn, UserPlus } from 'lucide-react'
import { Link } from 'react-router-dom'

export function AuthRequired({ title }: { title: string }) {
  return (
    <section className="glass-panel mx-auto my-16 w-full max-w-xl rounded-3xl border border-slate-800 p-8 text-center flex flex-col items-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-4 shadow-lg shadow-indigo-500/10">
        <KeyRound size={28} />
      </div>
      <h1 className="text-2xl font-black text-white">{title}</h1>
      <p className="mt-2 text-sm text-slate-300 max-w-md leading-relaxed mb-8">
        Vui lòng đăng nhập với tài khoản có quyền truy cập để sử dụng tính năng này.
      </p>
      <div className="flex items-center gap-3">
        <Link
          className="flex items-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-6 py-3 text-sm shadow-lg shadow-indigo-600/30 transition"
          to="/login"
        >
          <LogIn size={18} />
          Đăng nhập
        </Link>
        <Link
          className="flex items-center gap-2 rounded-2xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-6 py-3 text-sm transition"
          to="/register"
        >
          <UserPlus size={18} />
          Đăng ký
        </Link>
      </div>
    </section>
  )
}
