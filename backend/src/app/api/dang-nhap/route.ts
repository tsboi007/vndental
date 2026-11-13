import type { NextRequest } from 'next/server'
import { q1 } from '@/lib/db'
import { xuLy } from '@/lib/api'
import { kiemTraMatKhau } from '@/lib/mat-khau'
import { homeOf, taoToken, THOI_HAN, type VaiTro } from '@/lib/session'

// POST form (ten_dang_nhap, mat_khau) -> { token, vai_tro, home, max_age } | { error }.
// Sai tên hay sai mật khẩu đều báo chung một câu, cùng thời gian xử lý (hash giả trong kiemTraMatKhau).
export async function POST(req: NextRequest) {
  return xuLy(req, async () => {
    const fd = await req.formData()
    const ten = String(fd.get('ten_dang_nhap') ?? '').trim().toLowerCase()
    const matKhau = String(fd.get('mat_khau') ?? '')
    if (!ten || !matKhau) return { error: 'Nhập tên đăng nhập và mật khẩu.' }
    const nv = await q1<{ id: number; vai_tro: VaiTro; mat_khau_hash: string | null }>(
      'SELECT id, vai_tro, mat_khau_hash FROM nhan_vien WHERE ten_dang_nhap = $1 AND dang_lam_viec',
      [ten],
    )
    const dung = await kiemTraMatKhau(matKhau, nv?.mat_khau_hash)
    if (!nv?.mat_khau_hash || !dung) return { error: 'Sai tên đăng nhập hoặc mật khẩu.' }
    return { token: taoToken({ id: nv.id, mat_khau_hash: nv.mat_khau_hash }), vai_tro: nv.vai_tro, home: homeOf(nv.vai_tro), max_age: THOI_HAN }
  })
}
