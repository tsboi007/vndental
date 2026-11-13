import { Suspense } from 'react'
import { q } from '@/lib/db'
import { VAI_TRO, tenNgan } from '@/lib/format'
import { dangNhap } from './actions'

export const metadata = { title: 'Đăng nhập' }

type Row = { id: number; ho_ten: string; vai_tro: string; ban_thoi_gian: boolean }

async function DanhSach() {
  const rows = await q<Row>(
    `SELECT id, ho_ten, vai_tro, ban_thoi_gian FROM nhan_vien WHERE dang_lam_viec
     ORDER BY array_position(ARRAY['le_tan','bac_si','quan_ly'], vai_tro), id`,
  )
  return (
    <div className="grid gap-2">
      {rows.map((r) => (
        <form key={r.id} action={dangNhap}>
          <input type="hidden" name="id" value={r.id} />
          <button className="card flex w-full items-center gap-3 px-4 py-3 text-left hover:border-brand hover:bg-brand-50">
            <span className="flex size-9 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700">
              {tenNgan(r.ho_ten).slice(0, 2)}
            </span>
            <span className="flex-1">
              <span className="block font-medium">{tenNgan(r.ho_ten, r.vai_tro)}</span>
              <span className="block text-xs text-gray-500">
                {r.ho_ten} · {VAI_TRO[r.vai_tro]}
                {r.ban_thoi_gian ? ' · bán thời gian' : ''}
              </span>
            </span>
            <span className="text-sm text-brand">Vào →</span>
          </button>
        </form>
      ))}
    </div>
  )
}

export default function DangNhapPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <div className="mb-6 flex items-center gap-3">
        <span className="flex size-11 items-center justify-center rounded-lg bg-brand text-lg font-bold text-white">NC</span>
        <div>
          <h1 className="text-xl font-semibold">Nụ Cười Việt</h1>
          <p className="text-sm text-gray-500">Chọn nhân viên để vào hệ thống</p>
        </div>
      </div>
      <Suspense fallback={<p className="text-sm text-gray-500">Đang tải danh sách nhân viên…</p>}>
        <DanhSach />
      </Suspense>
      <p className="mt-6 text-xs text-gray-400">
        Bản demo: chưa có mật khẩu. Menu và quyền thao tác thay đổi theo vai trò lễ tân / bác sĩ / quản lý.
      </p>
    </main>
  )
}
