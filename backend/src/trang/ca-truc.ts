import type { SP } from '@/lib/api'
import { q } from '@/lib/db'
import { homNay, congNgay, thuTrongTuan, str } from '@/lib/format'
import { requireNhanVien } from '@/lib/session'

export async function caTruc(sp: SP) {
  await requireNhanVien('quan_ly')
  const goc = str(sp.tuan) || homNay()
  const tuan = congNgay(goc, 1 - thuTrongTuan(goc))
  const ngayTuan = Array.from({ length: 7 }, (_, i) => congNgay(tuan, i))
  const nhanVien = await q<{ id: number; ho_ten: string; vai_tro: string; ban_thoi_gian: boolean }>(
    "SELECT id, ho_ten, vai_tro, ban_thoi_gian FROM nhan_vien WHERE dang_lam_viec AND vai_tro <> 'quan_ly' ORDER BY vai_tro, id",
  )
  const ca = await q<{ id: number; nhan_vien_id: number; ngay: string; buoi: string; gio_bat_dau: string; gio_ket_thuc: string; vai_tro: string }>(
    `SELECT ct.id, ct.nhan_vien_id, ct.ngay, ct.buoi, ct.gio_bat_dau, ct.gio_ket_thuc, nv.vai_tro
     FROM ca_truc ct JOIN nhan_vien nv ON nv.id = ct.nhan_vien_id WHERE ct.ngay BETWEEN $1 AND $2 ORDER BY ct.gio_bat_dau`,
    [tuan, ngayTuan[6]],
  )
  return { goc, tuan, ngayTuan, nhanVien, ca }
}
