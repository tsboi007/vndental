import { run, n, s, type ActionState } from '@/lib/action'
import { tx } from '@/lib/db'
import { vnd } from '@/lib/format'
import { requireNhanVien } from '@/lib/session'

// Chốt két cuối ngày: tiền mặt đếm được so với hệ thống; lệch thì bắt buộc ghi chú.
export async function chotDoiSoat(_: ActionState, fd: FormData): Promise<ActionState> {
  const nv = await requireNhanVien('le_tan')
  return run(async () => {
    const dem = n(fd, 'dem')
    if (!(dem >= 0)) throw new Error('Nhập số tiền mặt đếm được.')
    await tx(nv.id, async (c) => {
      const ht = await c.query<{ tong: number }>(
        "SELECT coalesce(sum(so_tien), 0) AS tong FROM thanh_toan WHERE hinh_thuc = 'tien_mat' AND thu_luc::date = $1",
        [s(fd, 'ngay')],
      )
      const tong = ht.rows[0].tong
      if (dem !== tong && !s(fd, 'ghi_chu')) throw new Error(`Lệch ${vnd(dem - tong)} so với hệ thống — bắt buộc ghi chú lý do.`)
      await c.query(
        'INSERT INTO doi_soat_cuoi_ngay (ngay, tien_mat_he_thong, tien_mat_dem_duoc, nguoi_doi_soat_id, ghi_chu) VALUES ($1, $2, $3, $4, $5)',
        [s(fd, 'ngay'), tong, dem, nv.id, s(fd, 'ghi_chu') || null],
      )
    })
    return 'Đã chốt đối soát.'
  })
}
