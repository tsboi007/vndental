'use server'

import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { q1 } from '@/lib/db'
import { COOKIE, homeOf, type VaiTro } from '@/lib/session'

// Bản demo: chọn nhân viên để vào, chưa có mật khẩu (schema chưa có bảng tài khoản).
export async function dangNhap(fd: FormData) {
  const nv = await q1<{ id: number; vai_tro: VaiTro }>(
    'SELECT id, vai_tro FROM nhan_vien WHERE id = $1 AND dang_lam_viec',
    [Number(fd.get('id'))],
  )
  if (!nv) redirect('/dang-nhap')
  const jar = await cookies()
  const opt = { httpOnly: true, sameSite: 'lax' as const, path: '/', maxAge: 60 * 60 * 12 }
  jar.set(COOKIE, String(nv.id), opt)
  jar.set('vt', nv.vai_tro, opt)
  redirect(homeOf(nv.vai_tro))
}

export async function dangXuat() {
  const jar = await cookies()
  jar.delete(COOKIE)
  jar.delete('vt')
  redirect('/dang-nhap')
}
