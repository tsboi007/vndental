import type { SP } from '@/lib/api'
import { q, q1 } from '@/lib/db'
import { homNay, str } from '@/lib/format'
import { requireNhanVien } from '@/lib/session'

export async function doiSoat(sp: SP) {
  await requireNhanVien('le_tan')
  const ngay = str(sp.ngay) || homNay()
  const loc = str(sp.loc) || 'tien_mat'
  const thu = await q<{ id: number; thu_luc: string; hinh_thuc: string; so_tien: number; ma_hoa_don: string; hoa_don_id: number; ho_ten: string; nguoi: string }>(
    `SELECT t.id, t.thu_luc, t.hinh_thuc, t.so_tien, hd.ma_hoa_don, hd.id AS hoa_don_id, bn.ho_ten, nv.ho_ten AS nguoi
     FROM thanh_toan t JOIN hoa_don hd ON hd.id = t.hoa_don_id JOIN benh_nhan bn ON bn.id = hd.benh_nhan_id JOIN nhan_vien nv ON nv.id = t.nguoi_thu_id
     WHERE t.thu_luc::date = $1 ORDER BY t.thu_luc`,
    [ngay],
  )
  const chot = await q1<{ tien_mat_he_thong: number; tien_mat_dem_duoc: number; chenh_lech: number; ghi_chu: string | null; doi_soat_luc: string; nguoi: string }>(
    `SELECT d.*, nv.ho_ten AS nguoi FROM doi_soat_cuoi_ngay d JOIN nhan_vien nv ON nv.id = d.nguoi_doi_soat_id WHERE d.ngay = $1`,
    [ngay],
  )
  const no = await q<{ hoa_don_id: number; ma_hoa_don: string; ho_ten: string; con_no: number }>(
    `SELECT cn.hoa_don_id, cn.ma_hoa_don, bn.ho_ten, cn.con_no FROM v_cong_no_hoa_don cn JOIN benh_nhan bn ON bn.id = cn.benh_nhan_id
     WHERE cn.lap_luc::date = $1 AND cn.con_no > 0 ORDER BY cn.lap_luc`,
    [ngay],
  )
  return { ngay, loc, thu, chot, no }
}
