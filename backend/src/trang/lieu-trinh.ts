import type { SP } from '@/lib/api'
import { q } from '@/lib/db'
import { str } from '@/lib/format'
import { requireNhanVien } from '@/lib/session'

export async function lieuTrinh(sp: SP) {
  await requireNhanVien('bac_si', 'le_tan')
  const tt = str(sp.tt) || 'dang_lam'
  const ds = await q<{ id: number; ten: string; loai: string; ho_ten: string; benh_nhan_id: number; bac_si: string; ngay_bat_dau: string; tong_so_buoi: number; tong_chi_phi: number; da_lam: number; da_lap: number }>(
    `SELECT lt.id, lt.ten, lt.loai, bn.ho_ten, lt.benh_nhan_id, bs.ho_ten AS bac_si, lt.ngay_bat_dau, lt.tong_so_buoi, lt.tong_chi_phi,
            (SELECT count(DISTINCT phieu_id) FROM chi_tiet_dieu_tri WHERE lieu_trinh_id = lt.id) AS da_lam,
            (SELECT coalesce(sum(d.so_tien), 0) FROM lieu_trinh_dot d WHERE d.lieu_trinh_id = lt.id
               AND EXISTS (SELECT 1 FROM chi_tiet_hoa_don c WHERE c.lieu_trinh_dot_id = d.id)) AS da_lap
     FROM lieu_trinh lt JOIN benh_nhan bn ON bn.id = lt.benh_nhan_id JOIN nhan_vien bs ON bs.id = lt.bac_si_phu_trach_id
     WHERE lt.trang_thai = $1 ORDER BY lt.ngay_bat_dau DESC`,
    [tt],
  )
  return { tt, ds }
}
