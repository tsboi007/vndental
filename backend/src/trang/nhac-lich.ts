import type { SP } from '@/lib/api'
import { q } from '@/lib/db'
import { homNay, congNgay, str } from '@/lib/format'
import { requireNhanVien } from '@/lib/session'

type Row = {
  id: number
  gio_bat_dau: string
  trang_thai: string
  ho_ten: string
  sdt: string
  bac_si: string
  ghe: string
  viec: string | null
  so_goi: number
  nghe: boolean
  khong_nghe: boolean
  da_gui_tin: boolean
}

export async function nhacLich(sp: SP) {
  await requireNhanVien('le_tan')
  const ngay = str(sp.ngay) || congNgay(homNay(), 1)
  const loc = str(sp.loc)
  const rows = await q<Row>(
    `SELECT lh.id, lh.gio_bat_dau, lh.trang_thai, bn.ho_ten, bn.sdt, bs.ho_ten AS bac_si, g.ten AS ghe, dv.ten AS viec,
            count(nl.id) FILTER (WHERE nl.kenh = 'goi_dien') AS so_goi,
            coalesce(bool_or(nl.ket_qua = 'nghe_may'), false) AS nghe,
            coalesce(bool_or(nl.ket_qua = 'khong_nghe'), false) AS khong_nghe,
            coalesce(bool_or(nl.ket_qua = 'da_gui'), false) AS da_gui_tin
     FROM lich_hen lh
     JOIN benh_nhan bn ON bn.id = lh.benh_nhan_id
     JOIN nhan_vien bs ON bs.id = lh.bac_si_id
     JOIN ghe g ON g.id = lh.ghe_id
     LEFT JOIN dich_vu dv ON dv.id = lh.dich_vu_id
     LEFT JOIN nhac_lich nl ON nl.lich_hen_id = lh.id
     WHERE lh.ngay = $1 AND lh.trang_thai IN ('da_dat', 'da_nhac')
     GROUP BY lh.id, bn.id, bs.id, g.id, dv.id
     ORDER BY lh.gio_bat_dau, g.id`,
    [ngay],
  )
  return { ngay, loc, rows }
}
