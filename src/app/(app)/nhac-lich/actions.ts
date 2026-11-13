'use server'

import { tx } from '@/lib/db'
import { run, s, n, type ActionState } from '@/lib/action'
import { requireNhanVien } from '@/lib/session'

// Ghi một lần nhắc. Nghe máy hoặc đã gửi tin => lịch chuyển "đã nhắc".
// Tin nhắn hiện được ghi nhận như đã gửi (chưa nối dịch vụ SMS thật).
export async function ghiNhac(_: ActionState, fd: FormData): Promise<ActionState> {
  const nv = await requireNhanVien('le_tan')
  const ketQua = s(fd, 'kq')
  const kenh = ketQua === 'da_gui' ? 'tin_nhan' : 'goi_dien'
  return run(async () => {
    await tx(nv.id, async (c) => {
      await c.query('INSERT INTO nhac_lich (lich_hen_id, kenh, ket_qua, nhan_vien_id) VALUES ($1, $2, $3, $4)', [
        n(fd, 'id'), kenh, ketQua, kenh === 'tin_nhan' ? null : nv.id,
      ])
      if (ketQua === 'nghe_may' || ketQua === 'da_gui') {
        await c.query("UPDATE lich_hen SET trang_thai = 'da_nhac' WHERE id = $1 AND trang_thai = 'da_dat'", [n(fd, 'id')])
      }
    })
    return 'Đã ghi kết quả nhắc.'
  })
}

export async function guiTinHangLoat(_: ActionState, fd: FormData): Promise<ActionState> {
  const nv = await requireNhanVien('le_tan')
  return run(async () => {
    const r = await tx(nv.id, async (c) => {
      const ds = await c.query<{ id: number }>(
        `SELECT lh.id FROM lich_hen lh
         WHERE lh.ngay = $1 AND lh.trang_thai = 'da_dat'
           AND EXISTS (SELECT 1 FROM nhac_lich x WHERE x.lich_hen_id = lh.id AND x.ket_qua = 'khong_nghe')
           AND NOT EXISTS (SELECT 1 FROM nhac_lich x WHERE x.lich_hen_id = lh.id AND x.kenh = 'tin_nhan')`,
        [s(fd, 'ngay')],
      )
      for (const { id } of ds.rows) {
        await c.query("INSERT INTO nhac_lich (lich_hen_id, kenh, ket_qua) VALUES ($1, 'tin_nhan', 'da_gui')", [id])
        await c.query("UPDATE lich_hen SET trang_thai = 'da_nhac' WHERE id = $1", [id])
      }
      return ds.rowCount ?? 0
    })
    return r ? `Đã gửi tin nhắn cho ${r} người.` : 'Không còn ai cần gửi tin.'
  })
}
