import type { SP } from '@/lib/api'
import { q1 } from '@/lib/db'
import { str } from '@/lib/format'
import { type BenhNhan, timBenhNhan, dsBacSi } from '@/lib/data'
import { requireNhanVien } from '@/lib/session'

export async function lieuTrinhMoi(sp: SP) {
  await requireNhanVien('bac_si')
  const bn = str(sp.bn) ? await q1<BenhNhan>('SELECT * FROM benh_nhan WHERE id = $1', [Number(str(sp.bn))]) : undefined
  const tim = str(sp.tim)
  const ketQua = !bn && tim ? await timBenhNhan(tim, 10) : []
  const bacSi = await dsBacSi()
  return { bn, tim, ketQua, bacSi }
}
