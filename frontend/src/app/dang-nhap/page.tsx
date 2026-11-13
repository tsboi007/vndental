import { ActionForm } from '@/components/ActionForm'
import { dangNhap } from './actions'

export const metadata = { title: 'Đăng nhập' }

export default function DangNhapPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-10">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-lg bg-brand text-lg font-bold text-white">NC</span>
        <div>
          <h1 className="text-xl font-semibold">Nụ Cười Việt</h1>
          <p className="text-sm text-gray-500">Đăng nhập hệ thống quản lý phòng khám</p>
        </div>
      </div>
      <ActionForm action={dangNhap} className="card grid gap-3 p-5">
        <label>
          <span className="label">Tên đăng nhập</span>
          <input name="ten_dang_nhap" required autoComplete="username" autoCapitalize="none" spellCheck={false} className="input" autoFocus />
        </label>
        <label>
          <span className="label">Mật khẩu</span>
          <input name="mat_khau" type="password" required autoComplete="current-password" className="input" />
        </label>
        <button className="btn-primary mt-1">Đăng nhập</button>
      </ActionForm>
      <p className="mt-6 text-xs text-gray-400">Quên mật khẩu? Nhờ quản lý đặt lại ở mục Nhân viên &amp; danh mục.</p>
    </main>
  )
}
