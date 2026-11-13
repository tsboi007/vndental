import type { SP } from '@/lib/api'
import { q } from '@/lib/db'
import { str } from '@/lib/format'
import { type BenhNhan, timBenhNhan } from '@/lib/data'
import { requireNhanVien } from '@/lib/session'

export async function benhNhan(sp: SP) {
  await requireNhanVien('le_tan', 'bac_si')
  const tim = str(sp.q)
  const ds = tim
    ? await timBenhNhan(tim, 100)
    : await q<BenhNhan & { lan_cuoi: string | null }>(
        `SELECT bn.*, max(p.kham_luc) AS lan_cuoi FROM benh_nhan bn LEFT JOIN phieu_dieu_tri p ON p.benh_nhan_id = bn.id
         GROUP BY bn.id ORDER BY max(p.kham_luc) DESC NULLS LAST LIMIT 50`,
      )
  const tong = await q<{ n: number }>('SELECT count(*) AS n FROM benh_nhan')
  return { tim, ds, tong }
}
