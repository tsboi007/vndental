import type { SP } from '@/lib/api'
import { q } from '@/lib/db'
import { str } from '@/lib/format'
import { requireNhanVien } from '@/lib/session'

export async function bangGia(sp: SP) {
  await requireNhanVien('quan_ly')
  const chon = Number(str(sp.dv)) || 0
  const ds = await q<{ id: number; ma: string; ten: string; don_vi: string; gia: number | null; tu: string | null }>(
    `SELECT dv.id, dv.ma, dv.ten, dv.don_vi, bg.don_gia AS gia, bg.hieu_luc_tu AS tu FROM dich_vu dv
     LEFT JOIN bang_gia bg ON bg.dich_vu_id = dv.id AND daterange(bg.hieu_luc_tu, bg.hieu_luc_den, '[)') @> current_date
     WHERE dv.dang_ap_dung ORDER BY dv.id`,
  )
  const dv = ds.find((d) => d.id === chon) ?? ds[0] ?? null
  const lichSu = dv
    ? await q<{ don_gia: number; hieu_luc_tu: string; hieu_luc_den: string | null; nguoi: string | null }>(
        `SELECT bg.don_gia, bg.hieu_luc_tu, bg.hieu_luc_den, nv.ho_ten AS nguoi FROM bang_gia bg LEFT JOIN nhan_vien nv ON nv.id = bg.nguoi_cap_nhat
         WHERE bg.dich_vu_id = $1 ORDER BY bg.hieu_luc_tu DESC`,
        [dv.id],
      )
    : []
  return { ds, dv, lichSu }
}
