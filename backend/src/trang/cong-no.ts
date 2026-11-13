import type { SP } from '@/lib/api'
import { q } from '@/lib/db'
import { str } from '@/lib/format'
import { requireNhanVien } from '@/lib/session'

type HD = { hoa_don_id: number; ma_hoa_don: string; lap_luc: string; tong_tien: number; da_thu: number; con_no: number; benh_nhan_id: number; ho_ten: string; sdt: string; noi_dung: string | null; so_ngay: number }

export async function congNo(sp: SP) {
  await requireNhanVien('quan_ly')
  const tim = str(sp.q).trim()
  const qua30 = str(sp.qua30) === '1'
  const rows = await q<HD>(
    `SELECT cn.*, bn.ho_ten, bn.sdt, current_date - cn.lap_luc::date AS so_ngay,
            (SELECT string_agg(mo_ta, ' · ') FROM chi_tiet_hoa_don WHERE hoa_don_id = cn.hoa_don_id) AS noi_dung
     FROM v_cong_no_hoa_don cn JOIN benh_nhan bn ON bn.id = cn.benh_nhan_id
     WHERE cn.con_no > 0 ORDER BY cn.lap_luc`,
  )
  const thuThang = await q<{ tong: number; lan: number }>(
    `SELECT coalesce(sum(t.so_tien), 0) AS tong, count(*) AS lan FROM thanh_toan t JOIN hoa_don hd ON hd.id = t.hoa_don_id
     WHERE date_trunc('month', t.thu_luc) = date_trunc('month', now()) AND t.thu_luc::date > hd.lap_luc::date`,
  )
  return { tim, qua30, rows, thuThang }
}
