'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { q1 } from '@/lib/db'
import { s, type ActionState } from '@/lib/action'
import { kiemTraMatKhau } from '@/lib/mat-khau'
import { COOKIE, homeOf, taoPhien, type VaiTro } from '@/lib/session'

// Đăng nhập bằng tên đăng nhập + mật khẩu (G13: mỗi nhân viên một tài khoản).
// Sai tên hay sai mật khẩu đều báo chung một câu, cùng thời gian xử lý.
export async function dangNhap(_: ActionState, fd: FormData): Promise<ActionState> {
  const ten = s(fd, 'ten_dang_nhap').toLowerCase()
  const matKhau = String(fd.get('mat_khau') ?? '')
  if (!ten || !matKhau) return { error: 'Nhập tên đăng nhập và mật khẩu.', at: Date.now() }
  const nv = await q1<{ id: number; vai_tro: VaiTro; mat_khau_hash: string | null }>(
    'SELECT id, vai_tro, mat_khau_hash FROM nhan_vien WHERE ten_dang_nhap = $1 AND dang_lam_viec',
    [ten],
  )
  const dung = await kiemTraMatKhau(matKhau, nv?.mat_khau_hash)
  if (!nv?.mat_khau_hash || !dung) return { error: 'Sai tên đăng nhập hoặc mật khẩu.', at: Date.now() }
  await taoPhien({ id: nv.id, vai_tro: nv.vai_tro, mat_khau_hash: nv.mat_khau_hash })
  redirect(homeOf(nv.vai_tro))
}

export async function dangXuat() {
  const jar = await cookies()
  jar.delete(COOKIE)
  jar.delete('vt')
  redirect('/dang-nhap')
}
