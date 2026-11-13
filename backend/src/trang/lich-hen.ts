import type { SP } from '@/lib/api'
import { q } from '@/lib/db'
import { homNay, str } from '@/lib/format'
import { caTrucNgay } from '@/lib/data'
import { requireNhanVien } from '@/lib/session'

type Lich = {
  id: number
  ghe_id: number
  gio_bat_dau: string
  trang_thai: string
  bac_si_id: number
  bac_si: string
  benh_nhan: string
  viec: string | null
  noi_dung: string | null
}

export async function lichHen(sp: SP) {
  await requireNhanVien('le_tan', 'bac_si')
  const ngay = str(sp.ngay) || homNay()
  const loc = Number(str(sp.bs)) || 0

  const [lich, ca, ghe, huy] = await Promise.all([
    q<Lich>(
      `SELECT lh.id, lh.ghe_id, lh.gio_bat_dau, lh.trang_thai, lh.bac_si_id, bs.ho_ten AS bac_si,
              bn.ho_ten AS benh_nhan, dv.ten AS viec, lh.noi_dung
       FROM lich_hen lh
       JOIN benh_nhan bn ON bn.id = lh.benh_nhan_id
       JOIN nhan_vien bs ON bs.id = lh.bac_si_id
       LEFT JOIN dich_vu dv ON dv.id = lh.dich_vu_id
       WHERE lh.ngay = $1 AND lh.trang_thai <> 'da_huy'`,
      [ngay],
    ),
    caTrucNgay(ngay),
    q<{ id: number; ten: string }>('SELECT id, ten FROM ghe WHERE dang_hoat_dong ORDER BY id'),
    q<{ n: number }>("SELECT count(*) AS n FROM lich_hen WHERE ngay = $1 AND trang_thai = 'da_huy'", [ngay]),
  ])
  return { ngay, loc, lich, ca, ghe, huy }
}
