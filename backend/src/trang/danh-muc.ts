import type { SP } from '@/lib/api'
import { q } from '@/lib/db'
import { str } from '@/lib/format'
import { requireNhanVien } from '@/lib/session'

export async function danhMuc(sp: SP) {
  await requireNhanVien('quan_ly')
  const tab = str(sp.tab) || 'nhan_vien'

  const [nhanVien, dichVu, ghe, lyDo] = await Promise.all([
    q<{ id: number; ho_ten: string; sdt: string | null; vai_tro: string; ten_dang_nhap: string; ban_thoi_gian: boolean; dang_lam_viec: boolean; so_ca_tuan: number; co_mat_khau: boolean }>(
      `SELECT nv.id, nv.ho_ten, nv.sdt, nv.vai_tro, nv.ten_dang_nhap, nv.ban_thoi_gian, nv.dang_lam_viec, nv.mat_khau_hash IS NOT NULL AS co_mat_khau, (SELECT count(*) FROM ca_truc ct WHERE ct.nhan_vien_id = nv.id AND ct.ngay BETWEEN current_date AND current_date + 6) AS so_ca_tuan
       FROM nhan_vien nv ORDER BY nv.dang_lam_viec DESC, array_position(ARRAY['bac_si','le_tan','quan_ly'], nv.vai_tro::text), nv.id`,
    ),
    q<{ id: number; ma: string; ten: string; nhom: string | null; don_vi: string; theo_rang: boolean; dang_ap_dung: boolean; gia: number | null; so_lan: number }>(
      `SELECT dv.*, gia_tai_ngay(dv.id, current_date) AS gia,
              (SELECT count(*) FROM chi_tiet_dieu_tri ct WHERE ct.dich_vu_id = dv.id) AS so_lan
       FROM dich_vu dv ORDER BY dv.dang_ap_dung DESC, dv.id`,
    ),
    q<{ id: number; ten: string; dang_hoat_dong: boolean; lich_sap_toi: number }>(
      `SELECT g.*, (SELECT count(*) FROM lich_hen lh WHERE lh.ghe_id = g.id AND lh.ngay >= current_date AND lh.trang_thai IN ('da_dat','da_nhac')) AS lich_sap_toi
       FROM ghe g ORDER BY g.id`,
    ),
    q<{ ma: string; ten: string; dang_dung: boolean; so_lan: number }>(
      `SELECT ld.*, (SELECT count(*) FROM lich_hen lh WHERE lh.ly_do_huy_ma = ld.ma) AS so_lan
       FROM ly_do_huy ld ORDER BY ld.dang_dung DESC, so_lan DESC`,
    ),
  ])
  return { tab, nhanVien, dichVu, ghe, lyDo }
}
