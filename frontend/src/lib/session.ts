import 'server-only'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { goiBackend } from './api'

export type VaiTro = 'bac_si' | 'le_tan' | 'quan_ly'

export type NhanVien = {
  id: number
  ho_ten: string
  vai_tro: VaiTro
  ban_thoi_gian: boolean
  vat_tu_sap_het: number
}

// Hỏi backend token trong cookie là của ai (GET /api/toi). cache(): layout và trang trong cùng
// một request chỉ gọi backend một lần.
export const getNhanVien = cache(async (): Promise<NhanVien | null> => {
  const res = await goiBackend('/api/toi')
  if (res.status === 401) return null
  if (!res.ok) throw new Error(`Backend lỗi ${res.status} khi kiểm tra đăng nhập.`)
  return res.json()
})

// Chỉ để chuyển trang cho đúng (về /dang-nhap hoặc /khong-quyen). Quyền thật do backend kiểm ở từng API.
// Quản lý có toàn quyền (giả định G7). Không truyền vai trò = chỉ cần đăng nhập.
export async function requireNhanVien(...roles: VaiTro[]): Promise<NhanVien> {
  const nv = await getNhanVien()
  if (!nv) redirect('/dang-nhap')
  if (roles.length && nv.vai_tro !== 'quan_ly' && !roles.includes(nv.vai_tro)) redirect('/khong-quyen')
  return nv
}

export function homeOf(vaiTro: VaiTro): string {
  return vaiTro === 'bac_si' ? '/phieu-dieu-tri' : vaiTro === 'quan_ly' ? '/bao-cao' : '/lich-hen'
}
