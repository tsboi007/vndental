import 'server-only'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { q1 } from './db'

export type VaiTro = 'bac_si' | 'le_tan' | 'quan_ly'

export type NhanVien = {
  id: number
  ho_ten: string
  vai_tro: VaiTro
  ban_thoi_gian: boolean
}

export const COOKIE = 'nv'

export async function getNhanVien(): Promise<NhanVien | null> {
  const id = Number((await cookies()).get(COOKIE)?.value)
  if (!id) return null
  const nv = await q1<NhanVien>(
    'SELECT id, ho_ten, vai_tro, ban_thoi_gian FROM nhan_vien WHERE id = $1 AND dang_lam_viec',
    [id],
  )
  return nv ?? null
}

// Quản lý có toàn quyền (giả định G7). Không truyền vai trò = chỉ cần đăng nhập.
export async function requireNhanVien(...roles: VaiTro[]): Promise<NhanVien> {
  const nv = await getNhanVien()
  if (!nv) redirect('/dang-nhap')
  if (roles.length && nv.vai_tro !== 'quan_ly' && !roles.includes(nv.vai_tro)) {
    // Không ném lỗi: ở production Next ẩn nội dung lỗi phía server, người dùng chỉ thấy mã lỗi khó hiểu.
    redirect('/khong-quyen')
  }
  return nv
}

export function homeOf(vaiTro: VaiTro): string {
  return vaiTro === 'bac_si' ? '/phieu-dieu-tri' : vaiTro === 'quan_ly' ? '/bao-cao' : '/lich-hen'
}
