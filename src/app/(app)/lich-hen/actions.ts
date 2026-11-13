'use server'

import { redirect } from 'next/navigation'
import { q1, tx } from '@/lib/db'
import { loiTiengViet, run, s, n, batBuoc, type ActionState } from '@/lib/action'
import { requireNhanVien } from '@/lib/session'

export async function datLich(_: ActionState, fd: FormData): Promise<ActionState> {
  const nv = await requireNhanVien('le_tan', 'bac_si')
  const ngay = s(fd, 'ngay')
  try {
    batBuoc([s(fd, 'bn'), 'bệnh nhân'], [s(fd, 'bs'), 'bác sĩ'], [ngay, 'ngày'], [s(fd, 'gio'), 'khung giờ'], [s(fd, 'ghe'), 'ghế'])
    const lt = n(fd, 'lieu_trinh')
    await tx(nv.id, (c) =>
      c.query(
        `INSERT INTO lich_hen (benh_nhan_id, bac_si_id, ghe_id, ngay, gio_bat_dau, dich_vu_id, noi_dung, lieu_trinh_id, buoi_thu, nguoi_dat_id, doi_tu_lich_hen_id)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
        [
          n(fd, 'bn'), n(fd, 'bs'), n(fd, 'ghe'), ngay, s(fd, 'gio'),
          n(fd, 'dich_vu') || null, s(fd, 'noi_dung') || null,
          lt || null, lt ? n(fd, 'buoi_thu') || 1 : null, nv.id,
          n(fd, 'doi') || null, // dời lịch: liên kết với lịch cũ đã hủy (P5)
        ],
      ),
    )
  } catch (e) {
    return { error: loiTiengViet(e) }
  }
  redirect(`/lich-hen?ngay=${ngay}`)
}

export async function doiTrangThai(_: ActionState, fd: FormData): Promise<ActionState> {
  const nv = await requireNhanVien('le_tan', 'bac_si')
  const tt = s(fd, 'tt')
  return run(async () => {
    if (!['da_den', 'khong_den'].includes(tt)) throw new Error('Trạng thái không hợp lệ.')
    const r = await tx(nv.id, (c) =>
      c.query(
        `UPDATE lich_hen SET trang_thai = $2::varchar, den_luc = CASE WHEN $2::varchar = 'da_den' THEN now() END
         WHERE id = $1 AND trang_thai IN ('da_dat', 'da_nhac') RETURNING id`,
        [n(fd, 'id'), tt],
      ),
    )
    if (!r.rowCount) throw new Error('Lịch hẹn không còn ở trạng thái chờ.')
    return tt === 'da_den' ? 'Đã ghi nhận bệnh nhân đến.' : 'Đã ghi nhận không đến.'
  })
}

export async function huyLich(_: ActionState, fd: FormData): Promise<ActionState> {
  const nv = await requireNhanVien('le_tan', 'bac_si')
  const id = n(fd, 'id')
  let lich: { benh_nhan_id: number; bac_si_id: number; dich_vu_id: number | null; ngay: string } | undefined
  try {
    batBuoc([s(fd, 'ben_huy'), 'bên hủy'], [s(fd, 'ly_do'), 'lý do hủy'])
    lich = await tx(nv.id, async (c) => {
      const r = await c.query(
        `UPDATE lich_hen SET trang_thai = 'da_huy', ben_huy = $2, ly_do_huy_ma = $3, ghi_chu_huy = $4,
                nguoi_ghi_huy_id = $5, huy_luc = now()
         WHERE id = $1 AND trang_thai IN ('da_dat', 'da_nhac')
         RETURNING benh_nhan_id, bac_si_id, dich_vu_id, greatest(ngay, current_date)::text AS ngay`,
        [id, s(fd, 'ben_huy'), s(fd, 'ly_do'), s(fd, 'ghi_chu') || null, nv.id],
      )
      if (!r.rowCount) throw new Error('Chỉ hủy được lịch đang chờ (đã đặt / đã nhắc).')
      return r.rows[0]
    })
  } catch (e) {
    return { error: loiTiengViet(e) }
  }
  if (s(fd, 'sau') === 'dat_lai' && lich) {
    // Dời lịch (lý do "doi_lich") thì lịch mới liên kết lịch cũ (P5); mở sẵn đúng ngày của lịch cũ.
    const doi = s(fd, 'ly_do') === 'doi_lich' ? `&doi=${id}` : ''
    redirect(`/lich-hen/dat?bn=${lich.benh_nhan_id}&bs=${lich.bac_si_id}&ngay=${lich.ngay}${doi}${lich.dich_vu_id ? `&dv=${lich.dich_vu_id}` : ''}`)
  }
  redirect(`/lich-hen/${id}`)
}

export async function taoBenhNhan(_: ActionState, fd: FormData): Promise<ActionState> {
  const nv = await requireNhanVien('le_tan', 'bac_si')
  let id: number
  try {
    batBuoc([s(fd, 'ho_ten'), 'họ tên'], [s(fd, 'sdt'), 'số điện thoại'])
    const giamHo = s(fd, 'sdt_la') === 'giam_ho'
    if (giamHo) batBuoc([s(fd, 'ten_giam_ho'), 'tên người giám hộ'], [s(fd, 'quan_he'), 'quan hệ'])
    const r = await tx(nv.id, (c) =>
      c.query<{ id: number }>(
        `INSERT INTO benh_nhan (id, ma_ho_so, ma_ho_so_giay, ho_ten, ngay_sinh, gioi_tinh, sdt, sdt_la_cua, ten_nguoi_giam_ho, dia_chi, di_ung, tien_su_benh, nguoi_tao_id)
         SELECT x, 'BN' || lpad(x::text, 5, '0'), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11 FROM nextval('benh_nhan_id_seq') x
         RETURNING id`,
        [
          s(fd, 'ma_giay') || null, s(fd, 'ho_ten'), s(fd, 'ngay_sinh') || null, s(fd, 'gioi_tinh') || null,
          s(fd, 'sdt').replace(/\D/g, ''), giamHo ? s(fd, 'quan_he') : null, giamHo ? s(fd, 'ten_giam_ho') : null,
          s(fd, 'dia_chi') || null, s(fd, 'di_ung') || null, s(fd, 'tien_su') || null, nv.id,
        ],
      ),
    )
    id = r.rows[0].id
  } catch (e) {
    const err = e as { constraint?: string }
    if (err.constraint === 'ux_benh_nhan_nguoi') {
      const cu = await q1<{ id: number }>(
        `SELECT id FROM benh_nhan WHERE sdt = $1 AND lower(ho_ten) = lower($2) AND ngay_sinh IS NOT DISTINCT FROM $3::date`,
        [s(fd, 'sdt').replace(/\D/g, ''), s(fd, 'ho_ten'), s(fd, 'ngay_sinh') || null],
      )
      return { error: `Đã có hồ sơ trùng số điện thoại + họ tên + ngày sinh${cu ? ` (mã BN${String(cu.id).padStart(5, '0')})` : ''}.` }
    }
    return { error: loiTiengViet(e) }
  }
  redirect(s(fd, 'tiep') === 'dat_lich' ? `/lich-hen/dat?bn=${id}` : `/benh-nhan/${id}`)
}
