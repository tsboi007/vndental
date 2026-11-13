import type { SP } from '@/lib/api'
import { timBenhNhan } from '@/lib/data'
import { str } from '@/lib/format'
import { requireNhanVien } from '@/lib/session'

// Tạo hồ sơ: SĐT vừa nhập đã có người dùng chưa (L1 — tránh tạo trùng).
export async function benhNhanMoi(sp: SP) {
  await requireNhanVien('le_tan', 'bac_si')
  const sdt = str(sp.sdt).replace(/\D/g, '')
  const daCo = sdt.length >= 9 ? await timBenhNhan(sdt) : []
  return { sdt, daCo }
}
