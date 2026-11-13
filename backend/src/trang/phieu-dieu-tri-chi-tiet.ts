import type { SP } from '@/lib/api'
import { q, q1 } from '@/lib/db'
import { str } from '@/lib/format'
import { dsDichVu, dsBacSi } from '@/lib/data'
import { notFound } from '@/lib/ket-qua'
import { requireNhanVien } from '@/lib/session'

type Phieu = {
  id: number
  benh_nhan_id: number
  ho_ten: string
  ma_ho_so: string
  ngay_sinh: string | null
  sdt: string
  sdt_la_cua: string | null
  tien_su_benh: string | null
  di_ung: string | null
  trang_thai: string
  hoan_tat_luc: string | null
  kham_luc: string
  ghe: string
  bac_si_chinh_id: number
  bac_si: string
  chan_doan: string | null
  ghi_chu: string | null
  lich_hen_id: number | null
  trang_thai_lich: string | null
  hoa_don_id: number | null
  ma_hoa_don: string | null
}

export async function phieuChiTiet(sp: SP) {
  const nv = await requireNhanVien('bac_si', 'le_tan')
  const id = Number(sp.id)
  const rangChon = Number(str(sp.rang)) || 0
  const p = await q1<Phieu>(
    `SELECT p.*, bn.ho_ten, bn.ma_ho_so, bn.ngay_sinh, bn.sdt, bn.sdt_la_cua, bn.tien_su_benh, bn.di_ung, g.ten AS ghe, bs.ho_ten AS bac_si,
            lh.trang_thai AS trang_thai_lich, hd.id AS hoa_don_id, hd.ma_hoa_don
     FROM phieu_dieu_tri p JOIN benh_nhan bn ON bn.id = p.benh_nhan_id JOIN ghe g ON g.id = p.ghe_id
     JOIN nhan_vien bs ON bs.id = p.bac_si_chinh_id LEFT JOIN lich_hen lh ON lh.id = p.lich_hen_id
     LEFT JOIN hoa_don hd ON hd.phieu_dieu_tri_id = p.id
     WHERE p.id = $1`,
    [id],
  )
  if (!p) notFound()
  const sua = nv.vai_tro !== 'le_tan' && !p.hoa_don_id

  const [viec, thuoc, vatTuDung, lichSu, dichVu, bacSi, khoThuoc, khoVatTu, lieuTrinh] = await Promise.all([
    q<{ id: number; rang_so: number | null; dich_vu: string; so_luong: number; bac_si: string; lieu_trinh: string | null; buoi_thu: number | null; ghi_chu: string | null }>(
      `SELECT ct.id, ct.rang_so, dv.ten AS dich_vu, ct.so_luong, bs.ho_ten AS bac_si, lt.ten AS lieu_trinh, ct.buoi_thu, ct.ghi_chu
       FROM chi_tiet_dieu_tri ct JOIN dich_vu dv ON dv.id = ct.dich_vu_id JOIN nhan_vien bs ON bs.id = ct.bac_si_thuc_hien_id
       LEFT JOIN lieu_trinh lt ON lt.id = ct.lieu_trinh_id WHERE ct.phieu_id = $1 ORDER BY ct.id`,
      [id],
    ),
    q<{ id: number; ten: string; don_vi: string; lieu_dung: string; so_luong: number; da_hoan: boolean }>(
      `SELECT dt.id, vt.ten, vt.don_vi, dt.lieu_dung, dt.so_luong,
              EXISTS (SELECT 1 FROM giao_dich_kho g WHERE g.don_thuoc_id = dt.id AND g.loai = 'dieu_chinh') AS da_hoan
       FROM don_thuoc dt JOIN vat_tu vt ON vt.id = dt.vat_tu_id WHERE dt.phieu_id = $1 ORDER BY dt.id`,
      [id],
    ),
    q<{ ten: string; don_vi: string; so_luong: number; viec: string }>(
      `SELECT vt.ten, vt.don_vi, -gd.so_luong AS so_luong, dv.ten || coalesce(' ' || ct.rang_so, '') AS viec
       FROM giao_dich_kho gd JOIN vat_tu vt ON vt.id = gd.vat_tu_id JOIN chi_tiet_dieu_tri ct ON ct.id = gd.chi_tiet_dieu_tri_id
       JOIN dich_vu dv ON dv.id = ct.dich_vu_id WHERE ct.phieu_id = $1 AND gd.loai = 'xuat_dung' ORDER BY gd.id`,
      [id],
    ),
    q<{ id: number; bang: string; thao_tac: string; du_lieu_cu: Record<string, unknown> | null; du_lieu_moi: Record<string, unknown> | null; ai: string | null; vai_tro: string | null; sua_luc: string }>(
      `SELECT ls.id, ls.bang, ls.thao_tac, ls.du_lieu_cu, ls.du_lieu_moi, nv.ho_ten AS ai, nv.vai_tro, ls.sua_luc
       FROM lich_su_sua_phieu ls LEFT JOIN nhan_vien nv ON nv.id = ls.nhan_vien_id WHERE ls.phieu_id = $1 ORDER BY ls.id DESC`,
      [id],
    ),
    dsDichVu(),
    dsBacSi(),
    q<{ id: number; ten: string; don_vi: string; ton_kho: number }>("SELECT id, ten, don_vi, ton_kho FROM vat_tu WHERE loai = 'thuoc' AND gia_ban IS NOT NULL AND dang_su_dung ORDER BY ten"),
    q<{ id: number; ten: string; don_vi: string; ton_kho: number }>("SELECT id, ten, don_vi, ton_kho FROM vat_tu WHERE (loai = 'vat_tu' OR gia_ban IS NULL) AND dang_su_dung ORDER BY ten"),
    q<{ lieu_trinh_id: number; ten: string; so_buoi_da_lam: number; tong_so_buoi: number }>('SELECT lieu_trinh_id, ten, so_buoi_da_lam, tong_so_buoi FROM v_lieu_trinh_dang_do WHERE benh_nhan_id = $1', [p.benh_nhan_id]),
  ])
  return { id, rangChon, p, sua, viec, thuoc, vatTuDung, lichSu, dichVu, bacSi, khoThuoc, khoVatTu, lieuTrinh }
}
