import type { SP } from '@/lib/api'
import { q, q1 } from '@/lib/db'
import { dsLyDoHuy } from '@/lib/data'
import { notFound } from '@/lib/ket-qua'
import { requireNhanVien } from '@/lib/session'

type Lich = {
  id: number
  ngay: string
  gio_bat_dau: string
  trang_thai: string
  benh_nhan_id: number
  ho_ten: string
  ma_ho_so: string
  ngay_sinh: string | null
  sdt: string
  sdt_la_cua: string | null
  tien_su_benh: string | null
  di_ung: string | null
  ly_do_ten: string | null
  doi_tu_lich_hen_id: number | null
  doi_sang_id: number | null
  bac_si_id: number
  bac_si: string
  ghe: string
  viec: string | null
  noi_dung: string | null
  lieu_trinh: string | null
  buoi_thu: number | null
  nguoi_dat: string
  dat_luc: string
  ly_do_huy_ma: string | null
  ben_huy: string | null
  ghi_chu_huy: string | null
  nguoi_huy: string | null
  huy_luc: string | null
  phieu_id: number | null
}

export async function lichHenChiTiet(sp: SP) {
  await requireNhanVien('le_tan', 'bac_si')
  const { id } = sp
  const l = await q1<Lich>(
    `SELECT lh.*, bn.ho_ten, bn.ma_ho_so, bn.ngay_sinh, bn.sdt, bn.sdt_la_cua, bn.tien_su_benh, bn.di_ung,
            bs.ho_ten AS bac_si, g.ten AS ghe, dv.ten AS viec, lt.ten AS lieu_trinh, ld.ten AS ly_do_ten,
            nd.ho_ten AS nguoi_dat, nh.ho_ten AS nguoi_huy, p.id AS phieu_id,
            (SELECT x.id FROM lich_hen x WHERE x.doi_tu_lich_hen_id = lh.id ORDER BY x.id DESC LIMIT 1) AS doi_sang_id
     FROM lich_hen lh
     LEFT JOIN ly_do_huy ld ON ld.ma = lh.ly_do_huy_ma
     JOIN benh_nhan bn ON bn.id = lh.benh_nhan_id
     JOIN nhan_vien bs ON bs.id = lh.bac_si_id
     JOIN ghe g ON g.id = lh.ghe_id
     JOIN nhan_vien nd ON nd.id = lh.nguoi_dat_id
     LEFT JOIN nhan_vien nh ON nh.id = lh.nguoi_ghi_huy_id
     LEFT JOIN dich_vu dv ON dv.id = lh.dich_vu_id
     LEFT JOIN lieu_trinh lt ON lt.id = lh.lieu_trinh_id
     LEFT JOIN phieu_dieu_tri p ON p.lich_hen_id = lh.id
     WHERE lh.id = $1`,
    [Number(id)],
  )
  if (!l) notFound()
  const nhac = await q<{ kenh: string; ket_qua: string; thoi_diem: string; ai: string | null }>(
    `SELECT nl.kenh, nl.ket_qua, nl.thoi_diem, nv.ho_ten AS ai FROM nhac_lich nl LEFT JOIN nhan_vien nv ON nv.id = nl.nhan_vien_id
     WHERE nl.lich_hen_id = $1 ORDER BY nl.thoi_diem`,
    [l.id],
  )
  const choXuLy = ['da_dat', 'da_nhac'].includes(l.trang_thai)
  const lyDo = await dsLyDoHuy()
  return { id, l, nhac, choXuLy, lyDo }
}
