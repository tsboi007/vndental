'use server'

import { tx } from '@/lib/db'
import { run, s, n, batBuoc, type ActionState } from '@/lib/action'
import { requireNhanVien } from '@/lib/session'

export async function capNhatBenhNhan(_: ActionState, fd: FormData): Promise<ActionState> {
  const nv = await requireNhanVien('le_tan', 'bac_si')
  return run(async () => {
    batBuoc([s(fd, 'ho_ten'), 'họ tên'], [s(fd, 'sdt'), 'số điện thoại'])
    const laCua = s(fd, 'sdt_la_cua')
    await tx(nv.id, (c) =>
      c.query(
        `UPDATE benh_nhan SET ho_ten = $2, ngay_sinh = $3, gioi_tinh = $4, sdt = $5, sdt_la_cua = $6, ten_nguoi_giam_ho = $7,
                dia_chi = $8, tien_su_benh = $9, ma_ho_so_giay = $10, di_ung = $11
         WHERE id = $1`,
        [
          n(fd, 'id'), s(fd, 'ho_ten'), s(fd, 'ngay_sinh') || null, s(fd, 'gioi_tinh') || null, s(fd, 'sdt').replace(/\D/g, ''),
          laCua || null, laCua ? s(fd, 'ten_giam_ho') || null : null, s(fd, 'dia_chi') || null, s(fd, 'tien_su') || null,
          s(fd, 'ma_giay') || null, s(fd, 'di_ung') || null,
        ],
      ),
    )
    return 'Đã cập nhật hồ sơ.'
  })
}
