import type { SP } from '@/lib/api'
import { q } from '@/lib/db'
import { str } from '@/lib/format'
import { requireNhanVien } from '@/lib/session'

export async function kho(sp: SP) {
  await requireNhanVien('quan_ly')
  const loc = str(sp.loc) || 'tat_ca'
  const ds = await q<{ id: number; ma: string; ten: string; loai: string; don_vi: string; ton_kho: number; nguong_dat_them: number; gia_ban: number | null }>(
    'SELECT * FROM vat_tu WHERE dang_su_dung ORDER BY (ton_kho <= nguong_dat_them) DESC, loai, ten',
  )
  const sapHet = ds.filter((v) => v.ton_kho <= v.nguong_dat_them)
  const hien = loc === 'sap_het' ? sapHet : loc === 'tat_ca' ? ds : ds.filter((v) => v.loai === loc)
  const chon = ds.find((v) => v.id === Number(str(sp.vt))) ?? hien[0]
  const lichSu = chon
    ? await q<{ thoi_diem: string; loai: string; so_luong: number; ghi_chu: string | null; ai: string | null; viec: string | null; benh_nhan: string | null }>(
        `SELECT gd.thoi_diem, gd.loai, gd.so_luong, gd.ghi_chu, nv.ho_ten AS ai,
                dv.ten || coalesce(' ' || ct.rang_so, '') AS viec, coalesce(bn.ho_ten, bn2.ho_ten) AS benh_nhan
         FROM giao_dich_kho gd LEFT JOIN nhan_vien nv ON nv.id = gd.nhan_vien_id
         LEFT JOIN chi_tiet_dieu_tri ct ON ct.id = gd.chi_tiet_dieu_tri_id LEFT JOIN dich_vu dv ON dv.id = ct.dich_vu_id
         LEFT JOIN phieu_dieu_tri p ON p.id = ct.phieu_id LEFT JOIN benh_nhan bn ON bn.id = p.benh_nhan_id
         LEFT JOIN don_thuoc dt ON dt.id = gd.don_thuoc_id LEFT JOIN phieu_dieu_tri p2 ON p2.id = dt.phieu_id LEFT JOIN benh_nhan bn2 ON bn2.id = p2.benh_nhan_id
         WHERE gd.vat_tu_id = $1 ORDER BY gd.thoi_diem DESC, gd.id DESC LIMIT 15`,
        [chon.id],
      )
    : []
  return { loc, ds, sapHet, hien, chon, lichSu }
}
