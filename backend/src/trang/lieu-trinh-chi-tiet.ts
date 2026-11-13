import type { SP } from '@/lib/api'
import { q, q1 } from '@/lib/db'
import { notFound } from '@/lib/ket-qua'
import { requireNhanVien } from '@/lib/session'

export async function lieuTrinhChiTiet(sp: SP) {
  await requireNhanVien('bac_si', 'le_tan')
  const id = Number(sp.id)
  const lt = await q1<{ id: number; ten: string; loai: string; trang_thai: string; tong_so_buoi: number; tong_chi_phi: number; ngay_bat_dau: string; ghi_chu: string | null; benh_nhan_id: number; ho_ten: string; bac_si_id: number; bac_si: string }>(
    `SELECT lt.*, bn.ho_ten, bs.id AS bac_si_id, bs.ho_ten AS bac_si FROM lieu_trinh lt JOIN benh_nhan bn ON bn.id = lt.benh_nhan_id
     JOIN nhan_vien bs ON bs.id = lt.bac_si_phu_trach_id WHERE lt.id = $1`,
    [id],
  )
  if (!lt) notFound()
  const [dot, buoi, hen] = await Promise.all([
    q<{ id: number; dot_so: number; so_tien: number; mo_ta: string | null; ma_hoa_don: string | null; hoa_don_id: number | null; con_no: number | null }>(
      `SELECT d.id, d.dot_so, d.so_tien, d.mo_ta, hd.ma_hoa_don, hd.id AS hoa_don_id, cn.con_no
       FROM lieu_trinh_dot d LEFT JOIN chi_tiet_hoa_don c ON c.lieu_trinh_dot_id = d.id LEFT JOIN hoa_don hd ON hd.id = c.hoa_don_id
       LEFT JOIN v_cong_no_hoa_don cn ON cn.hoa_don_id = hd.id WHERE d.lieu_trinh_id = $1 ORDER BY d.dot_so`,
      [id],
    ),
    q<{ phieu_id: number; kham_luc: string; buoi_thu: number; bac_si: string; viec: string; ghi_chu: string | null }>(
      `SELECT p.id AS phieu_id, p.kham_luc, min(ct.buoi_thu) AS buoi_thu, bs.ho_ten AS bac_si,
              string_agg(dv.ten || coalesce(' ' || ct.rang_so, ''), ' · ') AS viec, p.ghi_chu
       FROM chi_tiet_dieu_tri ct JOIN phieu_dieu_tri p ON p.id = ct.phieu_id JOIN dich_vu dv ON dv.id = ct.dich_vu_id
       JOIN nhan_vien bs ON bs.id = p.bac_si_chinh_id WHERE ct.lieu_trinh_id = $1 GROUP BY p.id, bs.id ORDER BY p.kham_luc`,
      [id],
    ),
    q<{ id: number; ngay: string; gio_bat_dau: string; buoi_thu: number }>(
      "SELECT id, ngay, gio_bat_dau, buoi_thu FROM lich_hen WHERE lieu_trinh_id = $1 AND trang_thai IN ('da_dat','da_nhac') ORDER BY ngay",
      [id],
    ),
  ])
  return { id, lt, dot, buoi, hen }
}
