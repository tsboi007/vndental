import { redirect } from '@/lib/ket-qua'
import { tx } from '@/lib/db'
import { loiTiengViet, run, s, n, batBuoc, type ActionState } from '@/lib/action'
import { requireNhanVien } from '@/lib/session'

export async function moLieuTrinh(_: ActionState, fd: FormData): Promise<ActionState> {
  const nv = await requireNhanVien('bac_si')
  let id: number
  try {
    batBuoc([s(fd, 'bn'), 'bệnh nhân'], [s(fd, 'ten'), 'tên liệu trình'], [s(fd, 'bs'), 'bác sĩ phụ trách'])
    const tongBuoi = n(fd, 'tong_so_buoi')
    const tongTien = n(fd, 'tong_chi_phi')
    if (!(tongBuoi > 0)) throw new Error('Tổng số buổi phải lớn hơn 0.')
    if (!(tongTien >= 0)) throw new Error('Tổng chi phí không hợp lệ.')
    const dot = n(fd, 'so_dot') || 1
    id = await tx(nv.id, async (c) => {
      const r = await c.query<{ id: number }>(
        `INSERT INTO lieu_trinh (benh_nhan_id, bac_si_phu_trach_id, loai, ten, tong_so_buoi, tong_chi_phi, ngay_bat_dau, ghi_chu)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`,
        [n(fd, 'bn'), n(fd, 'bs'), s(fd, 'loai'), s(fd, 'ten'), tongBuoi, tongTien, s(fd, 'ngay_bat_dau'), s(fd, 'ghi_chu') || null],
      )
      // Chia đều tổng chi phí thành các đợt; đợt cuối nhận phần lẻ. Sửa từng đợt sau ở trang chi tiết.
      const moiDot = Math.floor(tongTien / dot / 1000) * 1000
      for (let i = 1; i <= dot && tongTien > 0; i++) {
        await c.query('INSERT INTO lieu_trinh_dot (lieu_trinh_id, dot_so, so_tien, mo_ta) VALUES ($1, $2, $3, $4)', [
          r.rows[0].id, i, i === dot ? tongTien - moiDot * (dot - 1) : moiDot, i === 1 ? 'Đặt cọc' : null,
        ])
      }
      return r.rows[0].id
    })
  } catch (e) {
    return { error: loiTiengViet(e) }
  }
  redirect(`/lieu-trinh/${id}`)
}

export async function capNhatLieuTrinh(_: ActionState, fd: FormData): Promise<ActionState> {
  const nv = await requireNhanVien('bac_si')
  return run(async () => {
    await tx(nv.id, (c) =>
      c.query('UPDATE lieu_trinh SET trang_thai = $2, tong_so_buoi = $3, ghi_chu = $4 WHERE id = $1', [
        n(fd, 'id'), s(fd, 'trang_thai'), n(fd, 'tong_so_buoi'), s(fd, 'ghi_chu') || null,
      ]),
    )
    return 'Đã cập nhật liệu trình.'
  })
}

export async function themDot(_: ActionState, fd: FormData): Promise<ActionState> {
  const nv = await requireNhanVien('bac_si', 'le_tan')
  return run(async () => {
    const tien = n(fd, 'so_tien')
    if (!(tien > 0)) throw new Error('Số tiền đợt phải lớn hơn 0.')
    await tx(nv.id, (c) =>
      c.query(
        `INSERT INTO lieu_trinh_dot (lieu_trinh_id, dot_so, so_tien, mo_ta)
         SELECT $1, coalesce(max(dot_so), 0) + 1, $2, $3 FROM lieu_trinh_dot WHERE lieu_trinh_id = $1`,
        [n(fd, 'id'), tien, s(fd, 'mo_ta') || null],
      ),
    )
    return 'Đã thêm đợt.'
  })
}

export async function suaDot(_: ActionState, fd: FormData): Promise<ActionState> {
  const nv = await requireNhanVien('bac_si', 'le_tan')
  return run(async () => {
    const r = await tx(nv.id, (c) =>
      c.query(
        `UPDATE lieu_trinh_dot SET so_tien = $2, mo_ta = $3 WHERE id = $1
         AND NOT EXISTS (SELECT 1 FROM chi_tiet_hoa_don WHERE lieu_trinh_dot_id = $1)`,
        [n(fd, 'dot'), n(fd, 'so_tien'), s(fd, 'mo_ta') || null],
      ),
    )
    if (!r.rowCount) throw new Error('Đợt đã lập hóa đơn, không sửa được.')
    return 'Đã sửa đợt.'
  })
}
