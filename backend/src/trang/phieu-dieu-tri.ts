import type { SP } from '@/lib/api'
import { q } from '@/lib/db'
import { homNay, str } from '@/lib/format'
import { requireNhanVien } from '@/lib/session'

export async function phieuDieuTri(sp: SP) {
  const nv = await requireNhanVien('bac_si')
  const tatCa = nv.vai_tro === 'quan_ly' || str(sp.tat_ca) === '1'
  const chon = Number(str(sp.lich)) || 0
  const hom = homNay()

  const cho = await q<{ id: number; gio_bat_dau: string; trang_thai: string; ho_ten: string; di_ung: string | null; tien_su_benh: string | null; bac_si: string; bac_si_id: number; ghe: string; viec: string | null; noi_dung: string | null; phieu_id: number | null }>(
    `SELECT lh.id, lh.gio_bat_dau, lh.trang_thai, bn.ho_ten, bn.di_ung, bn.tien_su_benh, bs.ho_ten AS bac_si, lh.bac_si_id, g.ten AS ghe,
            dv.ten AS viec, lh.noi_dung, p.id AS phieu_id
     FROM lich_hen lh JOIN benh_nhan bn ON bn.id = lh.benh_nhan_id JOIN nhan_vien bs ON bs.id = lh.bac_si_id
     JOIN ghe g ON g.id = lh.ghe_id LEFT JOIN dich_vu dv ON dv.id = lh.dich_vu_id LEFT JOIN phieu_dieu_tri p ON p.lich_hen_id = lh.id
     WHERE lh.ngay = $1 AND lh.trang_thai IN ('da_dat', 'da_nhac', 'da_den') AND ($2 OR lh.bac_si_id = $3)
     ORDER BY lh.trang_thai <> 'da_den', lh.gio_bat_dau`,
    [hom, tatCa, nv.id],
  )
  const phieu = await q<{ id: number; kham_luc: string; ho_ten: string; bac_si: string; viec: string | null; trang_thai: string | null; co_hoa_don: boolean }>(
    `SELECT p.id, p.kham_luc, bn.ho_ten, bs.ho_ten AS bac_si,
            (SELECT string_agg(dv.ten || coalesce(' ' || ct.rang_so, ''), ' · ') FROM chi_tiet_dieu_tri ct JOIN dich_vu dv ON dv.id = ct.dich_vu_id WHERE ct.phieu_id = p.id) AS viec,
            p.trang_thai, EXISTS (SELECT 1 FROM hoa_don WHERE phieu_dieu_tri_id = p.id) AS co_hoa_don
     FROM phieu_dieu_tri p JOIN benh_nhan bn ON bn.id = p.benh_nhan_id JOIN nhan_vien bs ON bs.id = p.bac_si_chinh_id
     LEFT JOIN lich_hen lh ON lh.id = p.lich_hen_id
     WHERE p.kham_luc::date = $1 AND ($2 OR p.bac_si_chinh_id = $3) ORDER BY p.kham_luc DESC`,
    [hom, tatCa, nv.id],
  )
  return { tatCa, chon, hom, cho, phieu }
}
