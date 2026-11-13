import { batBuoc, run, n, s, type ActionState } from '@/lib/action'
import { tx } from '@/lib/db'
import { requireNhanVien } from '@/lib/session'

export async function giaoDich(_: ActionState, fd: FormData): Promise<ActionState> {
  const nv = await requireNhanVien('quan_ly')
  return run(async () => {
    const loai = s(fd, 'loai')
    const sl = n(fd, 'so_luong')
    if (loai === 'nhap' && !(sl > 0)) throw new Error('Số lượng nhập phải lớn hơn 0.')
    if (loai === 'dieu_chinh') {
      if (!sl) throw new Error('Nhập số lượng điều chỉnh (âm để giảm, dương để tăng).')
      batBuoc([s(fd, 'ghi_chu'), 'lý do điều chỉnh'])
    }
    await tx(nv.id, (c) =>
      c.query('INSERT INTO giao_dich_kho (vat_tu_id, loai, so_luong, nhan_vien_id, ghi_chu) VALUES ($1, $2, $3, $4, $5)', [
        n(fd, 'vt'), loai, sl, nv.id, s(fd, 'ghi_chu') || null,
      ]),
    )
    return loai === 'nhap' ? 'Đã nhập kho.' : 'Đã điều chỉnh tồn.'
  })
}

export async function datNguong(_: ActionState, fd: FormData): Promise<ActionState> {
  const nv = await requireNhanVien('quan_ly')
  return run(async () => {
    await tx(nv.id, (c) =>
      c.query('UPDATE vat_tu SET nguong_dat_them = $2, gia_ban = $3 WHERE id = $1', [n(fd, 'vt'), n(fd, 'nguong') || 0, s(fd, 'gia_ban') ? n(fd, 'gia_ban') : null]),
    )
    return 'Đã lưu.'
  })
}

export async function themVatTu(_: ActionState, fd: FormData): Promise<ActionState> {
  const nv = await requireNhanVien('quan_ly')
  return run(async () => {
    batBuoc([s(fd, 'ma'), 'mã'], [s(fd, 'ten'), 'tên'], [s(fd, 'don_vi'), 'đơn vị'])
    await tx(nv.id, (c) =>
      c.query('INSERT INTO vat_tu (ma, ten, loai, don_vi, nguong_dat_them, gia_ban) VALUES ($1, $2, $3, $4, $5, $6)', [
        s(fd, 'ma').toUpperCase(), s(fd, 'ten'), s(fd, 'loai'), s(fd, 'don_vi'), n(fd, 'nguong') || 0, s(fd, 'gia_ban') ? n(fd, 'gia_ban') : null,
      ]),
    )
    return 'Đã thêm.'
  })
}
