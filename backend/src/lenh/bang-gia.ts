import { batBuoc, run, n, s, type ActionState } from '@/lib/action'
import { tx } from '@/lib/db'
import { ngay, vnd } from '@/lib/format'
import { requireNhanVien } from '@/lib/session'

// L5: không ghi đè giá cũ. Giá đang mở (không có ngày kết thúc) được đóng lại vào ngày giá mới bắt đầu.
export async function datGiaMoi(_: ActionState, fd: FormData): Promise<ActionState> {
  const nv = await requireNhanVien('quan_ly')
  return run(async () => {
    const gia = n(fd, 'don_gia')
    const tu = s(fd, 'tu')
    if (!(gia >= 0)) throw new Error('Đơn giá không hợp lệ.')
    batBuoc([tu, 'ngày áp dụng'])
    await tx(nv.id, async (c) => {
      const sau = await c.query<{ hieu_luc_tu: string }>('SELECT hieu_luc_tu FROM bang_gia WHERE dich_vu_id = $1 AND hieu_luc_tu >= $2', [n(fd, 'dv'), tu])
      if (sau.rowCount) throw new Error(`Đã có mức giá áp dụng từ ${ngay(sau.rows[0].hieu_luc_tu)}. Chọn ngày sau đó.`)
      await c.query('UPDATE bang_gia SET hieu_luc_den = $2 WHERE dich_vu_id = $1 AND hieu_luc_den IS NULL', [n(fd, 'dv'), tu])
      await c.query('INSERT INTO bang_gia (dich_vu_id, don_gia, hieu_luc_tu, nguoi_cap_nhat) VALUES ($1, $2, $3, $4)', [n(fd, 'dv'), gia, tu, nv.id])
    })
    return `Đã đặt giá ${vnd(gia)} từ ${ngay(tu)}.`
  })
}

// Thêm nhanh dịch vụ từ màn Bảng giá (khác themDichVu ở màn Danh mục).
export async function themDichVuNhanh(_: ActionState, fd: FormData): Promise<ActionState> {
  const nv = await requireNhanVien('quan_ly')
  return run(async () => {
    batBuoc([s(fd, 'ma'), 'mã'], [s(fd, 'ten'), 'tên dịch vụ'])
    const gia = n(fd, 'don_gia')
    if (!(gia >= 0)) throw new Error('Đơn giá không hợp lệ.')
    await tx(nv.id, async (c) => {
      const r = await c.query<{ id: number }>('INSERT INTO dich_vu (ma, ten, don_vi) VALUES ($1, $2, $3) RETURNING id', [s(fd, 'ma').toUpperCase(), s(fd, 'ten'), s(fd, 'don_vi') || 'lần'])
      await c.query('INSERT INTO bang_gia (dich_vu_id, don_gia, hieu_luc_tu, nguoi_cap_nhat) VALUES ($1, $2, current_date, $3)', [r.rows[0].id, gia, nv.id])
    })
    return 'Đã thêm dịch vụ.'
  })
}
