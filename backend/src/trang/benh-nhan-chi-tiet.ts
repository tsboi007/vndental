import type { SP } from '@/lib/api'
import { q, q1 } from '@/lib/db'
import { str } from '@/lib/format'
import { type BenhNhan } from '@/lib/data'
import { notFound } from '@/lib/ket-qua'
import { requireNhanVien } from '@/lib/session'

export async function benhNhanChiTiet(sp: SP) {
  await requireNhanVien('le_tan', 'bac_si')
  const id = Number(sp.id)
  const tab = str(sp.tab) || 'kham'
  const bn = await q1<BenhNhan>('SELECT * FROM benh_nhan WHERE id = $1', [id])
  if (!bn) notFound()

  const [kham, lich, hoaDon, lieuTrinh] = await Promise.all([
    q<{ id: number; kham_luc: string; bac_si: string; viec: string | null; ma_hoa_don: string | null; hoa_don_id: number | null; con_no: number | null }>(
      `SELECT p.id, p.kham_luc, bs.ho_ten AS bac_si,
              (SELECT string_agg(dv.ten || coalesce(' ' || ct.rang_so, '') || coalesce(' (buổi ' || ct.buoi_thu || ')', ''), ' · ' ORDER BY ct.id)
               FROM chi_tiet_dieu_tri ct JOIN dich_vu dv ON dv.id = ct.dich_vu_id WHERE ct.phieu_id = p.id) AS viec,
              hd.ma_hoa_don, hd.id AS hoa_don_id, cn.con_no
       FROM phieu_dieu_tri p JOIN nhan_vien bs ON bs.id = p.bac_si_chinh_id
       LEFT JOIN hoa_don hd ON hd.phieu_dieu_tri_id = p.id LEFT JOIN v_cong_no_hoa_don cn ON cn.hoa_don_id = hd.id
       WHERE p.benh_nhan_id = $1 ORDER BY p.kham_luc DESC`,
      [id],
    ),
    q<{ id: number; ngay: string; gio_bat_dau: string; trang_thai: string; bac_si: string; viec: string | null }>(
      `SELECT lh.id, lh.ngay, lh.gio_bat_dau, lh.trang_thai, bs.ho_ten AS bac_si, dv.ten AS viec
       FROM lich_hen lh JOIN nhan_vien bs ON bs.id = lh.bac_si_id LEFT JOIN dich_vu dv ON dv.id = lh.dich_vu_id
       WHERE lh.benh_nhan_id = $1 ORDER BY lh.ngay DESC, lh.gio_bat_dau DESC`,
      [id],
    ),
    q<{ hoa_don_id: number; ma_hoa_don: string; lap_luc: string; tong_tien: number; da_thu: number; con_no: number }>(
      'SELECT * FROM v_cong_no_hoa_don WHERE benh_nhan_id = $1 ORDER BY lap_luc DESC',
      [id],
    ),
    q<{ id: number; ten: string; trang_thai: string; tong_so_buoi: number; tong_chi_phi: number; bac_si: string; ngay_bat_dau: string; da_lam: number; da_thu: number }>(
      `SELECT lt.id, lt.ten, lt.trang_thai, lt.tong_so_buoi, lt.tong_chi_phi, bs.ho_ten AS bac_si, lt.ngay_bat_dau,
              (SELECT count(DISTINCT phieu_id) FROM chi_tiet_dieu_tri WHERE lieu_trinh_id = lt.id) AS da_lam,
              (SELECT coalesce(sum(least(cthd.thanh_tien, cn.da_thu)), 0) FROM lieu_trinh_dot d
                 JOIN chi_tiet_hoa_don cthd ON cthd.lieu_trinh_dot_id = d.id JOIN v_cong_no_hoa_don cn ON cn.hoa_don_id = cthd.hoa_don_id
                 WHERE d.lieu_trinh_id = lt.id) AS da_thu
       FROM lieu_trinh lt JOIN nhan_vien bs ON bs.id = lt.bac_si_phu_trach_id WHERE lt.benh_nhan_id = $1 ORDER BY lt.ngay_bat_dau DESC`,
      [id],
    ),
  ])
  return { id, tab, bn, kham, lich, hoaDon, lieuTrinh }
}
