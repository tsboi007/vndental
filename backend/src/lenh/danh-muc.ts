import { tx } from '@/lib/db'
import { run, s, n, batBuoc, type ActionState } from '@/lib/action'
import { bamMatKhau, matKhauTam } from '@/lib/mat-khau'
import { requireNhanVien } from '@/lib/session'

// UC23 — chỉ quản lý. Không xóa cứng: tắt "đang làm việc / đang hoạt động / đang dùng" để giữ lịch sử (G10).

export async function themNhanVien(_: ActionState, fd: FormData): Promise<ActionState> {
  const nv = await requireNhanVien('quan_ly')
  return run(async () => {
    batBuoc([s(fd, 'ho_ten'), 'họ tên'], [s(fd, 'vai_tro'), 'vai trò'], [s(fd, 'ten_dang_nhap'), 'tên đăng nhập'])
    if (!['bac_si', 'le_tan', 'quan_ly'].includes(s(fd, 'vai_tro'))) throw new Error('Vai trò không hợp lệ.')
    const tam = matKhauTam()
    const hash = await bamMatKhau(tam)
    await tx(nv.id, (c) =>
      c.query(
        'INSERT INTO nhan_vien (ho_ten, sdt, vai_tro, ten_dang_nhap, ban_thoi_gian, mat_khau_hash) VALUES ($1, $2, $3, $4, $5, $6)',
        [s(fd, 'ho_ten'), s(fd, 'sdt').replace(/\D/g, '') || null, s(fd, 'vai_tro'), s(fd, 'ten_dang_nhap').toLowerCase(), s(fd, 'ban_thoi_gian') === '1', hash],
      ),
    )
    return `Đã thêm ${s(fd, 'ho_ten')}. Mật khẩu tạm: ${tam} — chỉ hiện một lần, đưa cho nhân viên và nhắc đổi ngay.`
  })
}

// Quản lý đặt lại mật khẩu (nhân viên quên mật khẩu): sinh mật khẩu tạm, phiên cũ của người đó hết hiệu lực.
export async function datLaiMatKhau(_: ActionState, fd: FormData): Promise<ActionState> {
  const nv = await requireNhanVien('quan_ly')
  return run(async () => {
    const tam = matKhauTam()
    const hash = await bamMatKhau(tam)
    const r = await tx(nv.id, (c) =>
      c.query<{ ten_dang_nhap: string }>('UPDATE nhan_vien SET mat_khau_hash = $1 WHERE id = $2 RETURNING ten_dang_nhap', [hash, n(fd, 'id')]),
    )
    if (!r.rowCount) throw new Error('Không tìm thấy nhân viên.')
    return `Mật khẩu tạm của ${r.rows[0].ten_dang_nhap}: ${tam} — chỉ hiện một lần.`
  })
}

export async function doiTrangThaiNhanVien(_: ActionState, fd: FormData): Promise<ActionState> {
  const nv = await requireNhanVien('quan_ly')
  return run(async () => {
    const id = n(fd, 'id')
    if (id === nv.id) throw new Error('Không tự cho mình nghỉ việc được.')
    await tx(nv.id, (c) => c.query('UPDATE nhan_vien SET dang_lam_viec = NOT dang_lam_viec WHERE id = $1', [id]))
    return 'Đã cập nhật.'
  })
}

export async function themDichVu(_: ActionState, fd: FormData): Promise<ActionState> {
  const nv = await requireNhanVien('quan_ly')
  return run(async () => {
    batBuoc([s(fd, 'ma'), 'mã'], [s(fd, 'ten'), 'tên dịch vụ'], [s(fd, 'don_vi'), 'đơn vị'])
    await tx(nv.id, async (c) => {
      const r = await c.query<{ id: number }>(
        'INSERT INTO dich_vu (ma, ten, nhom, don_vi, theo_rang) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [s(fd, 'ma').toUpperCase(), s(fd, 'ten'), s(fd, 'nhom') || null, s(fd, 'don_vi'), s(fd, 'theo_rang') === '1'],
      )
      const gia = n(fd, 'gia')
      if (gia >= 0) await c.query('SELECT doi_gia($1, $2, current_date)', [r.rows[0].id, gia]) // giá đầu tiên (UC19)
    })
    return 'Đã thêm dịch vụ.'
  })
}

export async function batTatDichVu(_: ActionState, fd: FormData): Promise<ActionState> {
  const nv = await requireNhanVien('quan_ly')
  return run(async () => {
    await tx(nv.id, (c) => c.query('UPDATE dich_vu SET dang_ap_dung = NOT dang_ap_dung WHERE id = $1', [n(fd, 'id')]))
    return 'Đã cập nhật.'
  })
}

export async function themGhe(_: ActionState, fd: FormData): Promise<ActionState> {
  const nv = await requireNhanVien('quan_ly')
  return run(async () => {
    batBuoc([s(fd, 'ten'), 'tên ghế'])
    await tx(nv.id, (c) => c.query('INSERT INTO ghe (ten) VALUES ($1)', [s(fd, 'ten')]))
    return 'Đã thêm ghế.'
  })
}

export async function batTatGhe(_: ActionState, fd: FormData): Promise<ActionState> {
  const nv = await requireNhanVien('quan_ly')
  return run(async () => {
    await tx(nv.id, (c) => c.query('UPDATE ghe SET dang_hoat_dong = NOT dang_hoat_dong WHERE id = $1', [n(fd, 'id')]))
    return 'Đã cập nhật. Ghế ngừng hoạt động không nhận lịch hẹn mới (trigger kiểm tra lịch hẹn).'
  })
}

export async function themLyDo(_: ActionState, fd: FormData): Promise<ActionState> {
  const nv = await requireNhanVien('quan_ly')
  return run(async () => {
    batBuoc([s(fd, 'ma'), 'mã'], [s(fd, 'ten'), 'tên lý do'])
    const ma = s(fd, 'ma').toLowerCase().replace(/[^a-z0-9_]/g, '_')
    await tx(nv.id, (c) => c.query('INSERT INTO ly_do_huy (ma, ten) VALUES ($1, $2)', [ma, s(fd, 'ten')]))
    return 'Đã thêm lý do hủy.'
  })
}

export async function batTatLyDo(_: ActionState, fd: FormData): Promise<ActionState> {
  const nv = await requireNhanVien('quan_ly')
  return run(async () => {
    if (s(fd, 'ma') === 'doi_lich') throw new Error('Lý do "Dời lịch" do hệ thống dùng khi dời lịch, không tắt được.')
    await tx(nv.id, (c) => c.query('UPDATE ly_do_huy SET dang_dung = NOT dang_dung WHERE ma = $1', [s(fd, 'ma')]))
    return 'Đã cập nhật.'
  })
}
