'use server'

import { q1, tx } from '@/lib/db'
import { run, s, n, batBuoc, type ActionState } from '@/lib/action'
import { gioCa } from '@/lib/format'
import { requireNhanVien } from '@/lib/session'

// Ca có buổi (sáng / chiều); giờ mặc định theo G12, quản lý sửa được trong giờ mở cửa.
export async function themCa(_: ActionState, fd: FormData): Promise<ActionState> {
  const nv = await requireNhanVien('quan_ly')
  return run(async () => {
    batBuoc([s(fd, 'nv'), 'nhân viên'], [s(fd, 'ngay'), 'ngày'], [s(fd, 'buoi'), 'buổi'])
    const [tuMd, denMd] = gioCa(s(fd, 'ngay'), s(fd, 'buoi'))
    const tu = s(fd, 'tu') || tuMd
    const den = s(fd, 'den') || denMd
    if (den <= tu) throw new Error('Giờ kết thúc phải sau giờ bắt đầu.')
    await tx(nv.id, (c) =>
      c.query(
        'INSERT INTO ca_truc (nhan_vien_id, ngay, buoi, gio_bat_dau, gio_ket_thuc, nguoi_xep_id) VALUES ($1, $2, $3, $4, $5, $6)',
        [n(fd, 'nv'), s(fd, 'ngay'), s(fd, 'buoi'), tu, den, nv.id],
      ),
    )
    return 'Đã thêm ca.'
  })
}

// Bỏ ca: CSDL chặn nếu ca đang có lịch hẹn (trigger kiem_tra_sua_ca_truc, L11).
export async function xoaCa(_: ActionState, fd: FormData): Promise<ActionState> {
  const nv = await requireNhanVien('quan_ly')
  return run(async () => {
    const id = n(fd, 'id')
    const vuong = await q1<{ n: number }>(
      `SELECT count(*) AS n FROM lich_hen lh JOIN ca_truc ct ON ct.nhan_vien_id = lh.bac_si_id AND ct.ngay = lh.ngay
       WHERE ct.id = $1 AND lh.trang_thai <> 'da_huy'
         AND lh.gio_bat_dau >= ct.gio_bat_dau AND lh.gio_bat_dau < ct.gio_ket_thuc`,
      [id],
    )
    if (vuong?.n) throw new Error(`Ca này đang có ${vuong.n} lịch hẹn. Dời hoặc hủy các lịch đó trước khi bỏ ca.`)
    await tx(nv.id, (c) => c.query('DELETE FROM ca_truc WHERE id = $1', [id]))
    return 'Đã bỏ ca.'
  })
}

// Chép ca của tuần trước sang tuần đang xem; bỏ qua ca đã có cùng buổi hoặc chồng giờ.
export async function saoChepTuanTruoc(_: ActionState, fd: FormData): Promise<ActionState> {
  const nv = await requireNhanVien('quan_ly')
  return run(async () => {
    const r = await tx(nv.id, (c) =>
      c.query(
        `INSERT INTO ca_truc (nhan_vien_id, ngay, buoi, gio_bat_dau, gio_ket_thuc, nguoi_xep_id)
         SELECT ct.nhan_vien_id, ct.ngay + 7, ct.buoi, ct.gio_bat_dau, ct.gio_ket_thuc, $2 FROM ca_truc ct
         JOIN nhan_vien x ON x.id = ct.nhan_vien_id AND x.dang_lam_viec
         WHERE ct.ngay BETWEEN $1::date - 7 AND $1::date - 1
           AND NOT EXISTS (SELECT 1 FROM ca_truc y WHERE y.nhan_vien_id = ct.nhan_vien_id AND y.ngay = ct.ngay + 7
                           AND (y.buoi = ct.buoi OR (y.gio_bat_dau < ct.gio_ket_thuc AND ct.gio_bat_dau < y.gio_ket_thuc)))`,
        [s(fd, 'tuan'), nv.id],
      ),
    )
    return `Đã chép ${r.rowCount} ca.`
  })
}
