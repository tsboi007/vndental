import type { SP } from '@/lib/api'
import { q, q1 } from '@/lib/db'
import { dsBacSi } from '@/lib/data'
import { notFound } from '@/lib/ket-qua'
import { requireNhanVien } from '@/lib/session'

type HD = {
  id: number
  ma_hoa_don: string
  benh_nhan_id: number
  ho_ten: string
  ma_ho_so: string
  sdt: string
  phieu_dieu_tri_id: number | null
  kham_luc: string | null
  nguoi_lap: string
  lap_luc: string
  ghi_chu: string | null
  tong_tien: number
  da_thu: number
  con_no: number
}

export async function hoaDonChiTiet(sp: SP) {
  await requireNhanVien('le_tan')
  const id = Number(sp.id)
  const hd = await q1<HD>(
    `SELECT hd.*, bn.ho_ten, bn.ma_ho_so, bn.sdt, p.kham_luc, nl.ho_ten AS nguoi_lap, cn.tong_tien, cn.da_thu, cn.con_no
     FROM hoa_don hd JOIN benh_nhan bn ON bn.id = hd.benh_nhan_id JOIN nhan_vien nl ON nl.id = hd.nguoi_lap_id
     JOIN v_cong_no_hoa_don cn ON cn.hoa_don_id = hd.id LEFT JOIN phieu_dieu_tri p ON p.id = hd.phieu_dieu_tri_id
     WHERE hd.id = $1`,
    [id],
  )
  if (!hd) notFound()
  const [dong, thu, dot, bacSi] = await Promise.all([
    q<{ id: number; mo_ta: string; so_luong: number; don_gia: number; giam_gia: number; thanh_tien: number; bac_si: string | null }>(
      `SELECT c.id, c.mo_ta, c.so_luong, c.don_gia, c.giam_gia, c.thanh_tien, bs.ho_ten AS bac_si
       FROM chi_tiet_hoa_don c LEFT JOIN nhan_vien bs ON bs.id = c.bac_si_id WHERE c.hoa_don_id = $1 ORDER BY c.id`,
      [id],
    ),
    q<{ id: number; so_tien: number; hinh_thuc: string; ma_giao_dich: string | null; thu_luc: string; nguoi: string }>(
      `SELECT t.id, t.so_tien, t.hinh_thuc, t.ma_giao_dich, t.thu_luc, nv.ho_ten AS nguoi
       FROM thanh_toan t JOIN nhan_vien nv ON nv.id = t.nguoi_thu_id WHERE t.hoa_don_id = $1 ORDER BY t.thu_luc`,
      [id],
    ),
    q<{ id: number; ten: string; dot_so: number; mo_ta: string | null; so_tien: number }>(
      `SELECT d.id, lt.ten, d.dot_so, d.mo_ta, d.so_tien FROM lieu_trinh_dot d JOIN lieu_trinh lt ON lt.id = d.lieu_trinh_id
       WHERE lt.benh_nhan_id = $1 AND NOT EXISTS (SELECT 1 FROM chi_tiet_hoa_don c WHERE c.lieu_trinh_dot_id = d.id)
       ORDER BY lt.id, d.dot_so`,
      [hd.benh_nhan_id],
    ),
    dsBacSi(),
  ])
  return { id, hd, dong, thu, dot, bacSi }
}
