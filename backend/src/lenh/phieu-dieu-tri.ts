import { redirect } from '@/lib/ket-qua'
import { q1, tx } from '@/lib/db'
import { loiTiengViet, run, s, n, batBuoc, type ActionState } from '@/lib/action'
import { requireNhanVien } from '@/lib/session'

// Mở phiếu cho một lịch hẹn đã đến (hoặc trả về phiếu đã có).
export async function batDauKham(_: ActionState, fd: FormData): Promise<ActionState> {
  const nv = await requireNhanVien('bac_si')
  let id: number
  try {
    id = await tx(nv.id, async (c) => {
      const co = await c.query<{ id: number }>('SELECT id FROM phieu_dieu_tri WHERE lich_hen_id = $1', [n(fd, 'lich')])
      if (co.rowCount) return co.rows[0].id
      const r = await c.query<{ id: number }>(
        `INSERT INTO phieu_dieu_tri (benh_nhan_id, lich_hen_id, bac_si_chinh_id, ghe_id, kham_luc)
         SELECT benh_nhan_id, id, bac_si_id, ghe_id, date_trunc('minute', localtimestamp) FROM lich_hen
         WHERE id = $1 AND trang_thai = 'da_den' RETURNING id`,
        [n(fd, 'lich')],
      )
      if (!r.rowCount) throw new Error('Lịch hẹn chưa được lễ tân xác nhận "đã đến".')
      return r.rows[0].id
    })
  } catch (e) {
    return { error: loiTiengViet(e) }
  }
  redirect(`/phieu-dieu-tri/${id}`)
}

// Khách không hẹn: lễ tân tạo phiếu, chọn bác sĩ đang trực và ghế.
export async function khamVangLai(_: ActionState, fd: FormData): Promise<ActionState> {
  const nv = await requireNhanVien('le_tan', 'bac_si')
  let id: number
  try {
    batBuoc([s(fd, 'bs'), 'bác sĩ'], [s(fd, 'ghe'), 'ghế'])
    id = await tx(nv.id, async (c) => {
      const r = await c.query<{ id: number }>(
        `INSERT INTO phieu_dieu_tri (benh_nhan_id, bac_si_chinh_id, ghe_id, kham_luc)
         VALUES ($1, $2, $3, date_trunc('minute', localtimestamp)) RETURNING id`,
        [n(fd, 'bn'), n(fd, 'bs'), n(fd, 'ghe')],
      )
      return r.rows[0].id
    })
  } catch (e) {
    return { error: loiTiengViet(e) }
  }
  redirect(nv.vai_tro === 'le_tan' ? `/tiep-nhan?ok=${id}` : `/phieu-dieu-tri/${id}`)
}

async function chuaLapHoaDon(phieuId: number) {
  const hd = await q1<{ ma_hoa_don: string }>('SELECT ma_hoa_don FROM hoa_don WHERE phieu_dieu_tri_id = $1', [phieuId])
  if (hd) throw new Error(`Phiếu đã lập hóa đơn ${hd.ma_hoa_don}. Muốn đổi việc / thuốc thì sửa trên hóa đơn.`)
}

export async function luuChanDoan(_: ActionState, fd: FormData): Promise<ActionState> {
  const nv = await requireNhanVien('bac_si')
  return run(async () => {
    await tx(nv.id, (c) =>
      c.query('UPDATE phieu_dieu_tri SET chan_doan = $2, ghi_chu = $3 WHERE id = $1', [n(fd, 'phieu'), s(fd, 'chan_doan') || null, s(fd, 'ghi_chu') || null]),
    )
    return 'Đã lưu chẩn đoán.'
  })
}

export async function themViec(_: ActionState, fd: FormData): Promise<ActionState> {
  const nv = await requireNhanVien('bac_si')
  return run(async () => {
    batBuoc([s(fd, 'dich_vu'), 'dịch vụ'], [s(fd, 'bs'), 'bác sĩ thực hiện'])
    await chuaLapHoaDon(n(fd, 'phieu'))
    const lt = n(fd, 'lieu_trinh') || null
    await tx(nv.id, (c) =>
      c.query(
        `INSERT INTO chi_tiet_dieu_tri (phieu_id, dich_vu_id, rang_so, bac_si_thuc_hien_id, so_luong, lieu_trinh_id, buoi_thu, ghi_chu)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [n(fd, 'phieu'), n(fd, 'dich_vu'), n(fd, 'rang') || null, n(fd, 'bs'), n(fd, 'so_luong') || 1, lt, lt ? n(fd, 'buoi_thu') || 1 : null, s(fd, 'ghi_chu') || null],
      ),
    )
    return 'Đã thêm việc.'
  })
}

export async function xoaViec(_: ActionState, fd: FormData): Promise<ActionState> {
  const nv = await requireNhanVien('bac_si')
  return run(async () => {
    await chuaLapHoaDon(n(fd, 'phieu'))
    // Giao dịch kho không sửa / xóa được (P9) nên việc đã ghi vật tư thì giữ lại.
    const kho = await q1<{ n: number }>('SELECT count(*) AS n FROM giao_dich_kho WHERE chi_tiet_dieu_tri_id = $1', [n(fd, 'id')])
    if (kho?.n) throw new Error('Việc này đã ghi vật tư (đã trừ kho) nên không xóa được. Ghi chú lại trên dòng việc nếu cần.')
    await tx(nv.id, (c) => c.query('DELETE FROM chi_tiet_dieu_tri WHERE id = $1 AND phieu_id = $2', [n(fd, 'id'), n(fd, 'phieu')]))
    return 'Đã xóa việc (lịch sử sửa phiếu vẫn lưu dòng cũ).'
  })
}

export async function keThuoc(_: ActionState, fd: FormData): Promise<ActionState> {
  const nv = await requireNhanVien('bac_si')
  return run(async () => {
    batBuoc([s(fd, 'thuoc'), 'thuốc'], [s(fd, 'lieu_dung'), 'liều dùng'])
    await chuaLapHoaDon(n(fd, 'phieu'))
    // Trigger trừ kho tự động; không đủ tồn thì CSDL báo lỗi.
    await tx(nv.id, (c) =>
      c.query('INSERT INTO don_thuoc (phieu_id, vat_tu_id, lieu_dung, so_luong) VALUES ($1, $2, $3, $4)', [
        n(fd, 'phieu'), n(fd, 'thuoc'), s(fd, 'lieu_dung'), n(fd, 'so_luong'),
      ]),
    )
    return 'Đã kê thuốc và trừ kho.'
  })
}

// Đơn thuốc đã trừ kho bằng giao dịch "xuất kê đơn" (không sửa / xóa được — P9), nên dòng thuốc không xóa cứng.
// Kê nhầm: hoàn kho bằng một giao dịch điều chỉnh có ghi chú và ghi lại vào ghi chú phiếu.
export async function hoanThuoc(_: ActionState, fd: FormData): Promise<ActionState> {
  const nv = await requireNhanVien('bac_si')
  return run(async () => {
    await chuaLapHoaDon(n(fd, 'phieu'))
    await tx(nv.id, async (c) => {
      const r = await c.query<{ vat_tu_id: number; so_luong: number; ten: string }>(
        `SELECT dt.vat_tu_id, dt.so_luong, vt.ten FROM don_thuoc dt JOIN vat_tu vt ON vt.id = dt.vat_tu_id
         WHERE dt.id = $1 AND dt.phieu_id = $2`,
        [n(fd, 'id'), n(fd, 'phieu')],
      )
      if (!r.rowCount) throw new Error('Không tìm thấy dòng thuốc.')
      const da = await c.query('SELECT 1 FROM giao_dich_kho WHERE loai = $1 AND ghi_chu = $2', ['dieu_chinh', `Hoàn kho đơn thuốc #${n(fd, 'id')}`])
      if (da.rowCount) throw new Error('Dòng thuốc này đã được hoàn kho.')
      await c.query(
        "INSERT INTO giao_dich_kho (vat_tu_id, loai, so_luong, phieu_id, don_thuoc_id, nhan_vien_id, ghi_chu) VALUES ($1, 'dieu_chinh', $2, $3, $4, $5, $6)",
        [r.rows[0].vat_tu_id, r.rows[0].so_luong, n(fd, 'phieu'), n(fd, 'id'), nv.id, `Hoàn kho đơn thuốc #${n(fd, 'id')}`],
      )
      await c.query(
        `UPDATE phieu_dieu_tri SET ghi_chu = concat_ws(E'\n', ghi_chu, $2::text) WHERE id = $1`,
        [n(fd, 'phieu'), `Hủy kê ${r.rows[0].ten} × ${r.rows[0].so_luong} (đã hoàn kho).`],
      )
    })
    return 'Đã hoàn kho dòng thuốc; ghi chú đã cập nhật vào phiếu.'
  })
}

export async function ghiVatTu(_: ActionState, fd: FormData): Promise<ActionState> {
  const nv = await requireNhanVien('bac_si')
  return run(async () => {
    batBuoc([s(fd, 'vat_tu'), 'vật tư'], [s(fd, 'viec'), 'việc dùng vật tư'])
    const sl = n(fd, 'so_luong')
    if (!(sl > 0)) throw new Error('Số lượng phải lớn hơn 0.')
    await tx(nv.id, (c) =>
      c.query(
        `INSERT INTO giao_dich_kho (vat_tu_id, loai, so_luong, phieu_id, chi_tiet_dieu_tri_id, nhan_vien_id)
         SELECT $1, 'xuat_dung', $2, phieu_id, id, $4 FROM chi_tiet_dieu_tri WHERE id = $3`,
        [n(fd, 'vat_tu'), -sl, n(fd, 'viec'), nv.id],
      ),
    )
    return 'Đã ghi vật tư và trừ kho.'
  })
}

export async function hoanTat(_: ActionState, fd: FormData): Promise<ActionState> {
  const nv = await requireNhanVien('bac_si')
  return run(async () => {
    const co = await q1<{ n: number }>(
      'SELECT (SELECT count(*) FROM chi_tiet_dieu_tri WHERE phieu_id = $1) + (SELECT count(*) FROM don_thuoc WHERE phieu_id = $1) AS n',
      [n(fd, 'phieu')],
    )
    if (!co?.n) throw new Error('Phiếu chưa có việc hay thuốc nào.')
    await tx(nv.id, async (c) => {
      const r = await c.query(
        `UPDATE phieu_dieu_tri SET trang_thai = 'hoan_tat', hoan_tat_luc = now()
         WHERE id = $1 AND trang_thai = 'dang_kham'`,
        [n(fd, 'phieu')],
      )
      if (!r.rowCount) throw new Error('Phiếu đã hoàn tất trước đó.')
      await c.query(
        `UPDATE lich_hen SET trang_thai = 'hoan_thanh'
         WHERE id = (SELECT lich_hen_id FROM phieu_dieu_tri WHERE id = $1) AND trang_thai = 'da_den'`,
        [n(fd, 'phieu')],
      )
    })
    return 'Đã hoàn tất. Phiếu đã vào danh sách chờ thanh toán của lễ tân.'
  })
}
