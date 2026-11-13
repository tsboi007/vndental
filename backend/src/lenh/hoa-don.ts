import { redirect } from '@/lib/ket-qua'
import type { PoolClient } from 'pg'
import { tx } from '@/lib/db'
import { loiTiengViet, run, s, n, batBuoc, type ActionState } from '@/lib/action'
import { vnd } from '@/lib/format'
import { requireNhanVien } from '@/lib/session'

// Lập hóa đơn từ phiếu: mỗi việc / thuốc một dòng, giá tra theo ngày khám và chốt vào dòng (L5).
// Việc thuộc liệu trình không tính tiền theo dòng mà thu theo đợt (P9).
export async function lapHoaDon(_: ActionState, fd: FormData): Promise<ActionState> {
  const nv = await requireNhanVien('le_tan')
  let id: number
  try {
    id = await tx(nv.id, async (c) => {
      const co = await c.query<{ id: number }>('SELECT id FROM hoa_don WHERE phieu_dieu_tri_id = $1', [n(fd, 'phieu')])
      if (co.rowCount) return co.rows[0].id
      const hd = await c.query<{ id: number }>(
        `INSERT INTO hoa_don (id, ma_hoa_don, benh_nhan_id, phieu_dieu_tri_id, nguoi_lap_id)
         SELECT x, 'HD' || lpad(x::text, 5, '0'), p.benh_nhan_id, p.id, $2
         FROM phieu_dieu_tri p, nextval('hoa_don_id_seq') x WHERE p.id = $1 RETURNING id`,
        [n(fd, 'phieu'), nv.id],
      )
      const hdId = hd.rows[0].id
      await c.query(
        `INSERT INTO chi_tiet_hoa_don (hoa_don_id, chi_tiet_dieu_tri_id, mo_ta, so_luong, don_gia, bac_si_id)
         SELECT $1, ct.id, dv.ten || coalesce(' răng ' || ct.rang_so, ''), ct.so_luong,
                coalesce(gia_tai_ngay(ct.dich_vu_id, p.kham_luc::date), 0), ct.bac_si_thuc_hien_id
         FROM chi_tiet_dieu_tri ct JOIN dich_vu dv ON dv.id = ct.dich_vu_id JOIN phieu_dieu_tri p ON p.id = ct.phieu_id
         WHERE ct.phieu_id = $2 AND ct.lieu_trinh_id IS NULL ORDER BY ct.id`,
        [hdId, n(fd, 'phieu')],
      )
      await c.query(
        `INSERT INTO chi_tiet_hoa_don (hoa_don_id, don_thuoc_id, mo_ta, so_luong, don_gia, bac_si_id)
         SELECT $1, dt.id, vt.ten, dt.so_luong, coalesce(vt.gia_ban, 0), p.bac_si_chinh_id
         FROM don_thuoc dt JOIN vat_tu vt ON vt.id = dt.vat_tu_id JOIN phieu_dieu_tri p ON p.id = dt.phieu_id
         WHERE dt.phieu_id = $2 ORDER BY dt.id`,
        [hdId, n(fd, 'phieu')],
      )
      return hdId
    })
  } catch (e) {
    return { error: loiTiengViet(e) }
  }
  redirect(`/hoa-don/${id}`)
}

async function kiemTraKhongAm(c: PoolClient, hoaDonId: number) {
  const r = await c.query<{ tong: number; da_thu: number }>('SELECT tong_tien AS tong, da_thu FROM v_cong_no_hoa_don WHERE hoa_don_id = $1', [hoaDonId])
  if (r.rows[0] && r.rows[0].da_thu > r.rows[0].tong) {
    throw new Error(`Không được: hóa đơn đã thu ${vnd(r.rows[0].da_thu)}, tổng mới sẽ nhỏ hơn số đã thu.`)
  }
}

export async function suaGiamGia(_: ActionState, fd: FormData): Promise<ActionState> {
  const nv = await requireNhanVien('le_tan')
  return run(async () => {
    const g = n(fd, 'giam_gia')
    if (!(g >= 0)) throw new Error('Giảm giá không hợp lệ.')
    await tx(nv.id, async (c) => {
      await c.query('UPDATE chi_tiet_hoa_don SET giam_gia = $2 WHERE id = $1', [n(fd, 'dong'), g])
      await kiemTraKhongAm(c, n(fd, 'hoa_don'))
    })
    return 'Đã cập nhật giảm giá.'
  })
}

export async function xoaDong(_: ActionState, fd: FormData): Promise<ActionState> {
  const nv = await requireNhanVien('le_tan')
  return run(async () => {
    await tx(nv.id, async (c) => {
      await c.query('DELETE FROM chi_tiet_hoa_don WHERE id = $1 AND hoa_don_id = $2', [n(fd, 'dong'), n(fd, 'hoa_don')])
      await kiemTraKhongAm(c, n(fd, 'hoa_don'))
    })
    return 'Đã xóa dòng.'
  })
}

export async function themDong(_: ActionState, fd: FormData): Promise<ActionState> {
  const nv = await requireNhanVien('le_tan')
  return run(async () => {
    const dot = n(fd, 'dot')
    await tx(nv.id, async (c) => {
      if (dot) {
        await c.query(
          `INSERT INTO chi_tiet_hoa_don (hoa_don_id, lieu_trinh_dot_id, mo_ta, don_gia, bac_si_id)
           SELECT $1, d.id, lt.ten || ' — đợt ' || d.dot_so || coalesce(': ' || d.mo_ta, ''), d.so_tien, lt.bac_si_phu_trach_id
           FROM lieu_trinh_dot d JOIN lieu_trinh lt ON lt.id = d.lieu_trinh_id WHERE d.id = $2`,
          [n(fd, 'hoa_don'), dot],
        )
      } else {
        batBuoc([s(fd, 'mo_ta'), 'mô tả'])
        const gia = n(fd, 'don_gia')
        if (!(gia >= 0)) throw new Error('Đơn giá không hợp lệ.')
        await c.query('INSERT INTO chi_tiet_hoa_don (hoa_don_id, mo_ta, so_luong, don_gia, bac_si_id) VALUES ($1, $2, $3, $4, $5)', [
          n(fd, 'hoa_don'), s(fd, 'mo_ta'), n(fd, 'so_luong') || 1, gia, n(fd, 'bs') || null,
        ])
      }
    })
    return 'Đã thêm dòng.'
  })
}

// QĐ3: giảm giá cả hóa đơn được chia xuống từng dòng theo tỷ lệ thành tiền; phần lẻ dồn vào dòng lớn nhất.
export async function giamGiaTong(_: ActionState, fd: FormData): Promise<ActionState> {
  const nv = await requireNhanVien('le_tan')
  return run(async () => {
    const tien = n(fd, 'so_tien')
    batBuoc([s(fd, 'ly_do'), 'lý do giảm giá'])
    if (!(tien > 0)) throw new Error('Số tiền giảm phải lớn hơn 0.')
    await tx(nv.id, async (c) => {
      const dong = (
        await c.query<{ id: number; thanh_tien: number }>(
          'SELECT id, thanh_tien FROM chi_tiet_hoa_don WHERE hoa_don_id = $1 AND thanh_tien > 0 ORDER BY thanh_tien DESC, id FOR UPDATE',
          [n(fd, 'hoa_don')],
        )
      ).rows
      const tong = dong.reduce((a, d) => a + d.thanh_tien, 0)
      if (tien > tong) throw new Error(`Số tiền giảm lớn hơn tổng còn lại của hóa đơn (${vnd(tong)}).`)
      const phan = dong.map((d) => Math.floor((tien * d.thanh_tien) / tong))
      phan[0] += tien - phan.reduce((a, x) => a + x, 0)
      for (let i = 0; i < dong.length; i++) {
        if (phan[i]) await c.query('UPDATE chi_tiet_hoa_don SET giam_gia = giam_gia + $2 WHERE id = $1', [dong[i].id, phan[i]])
      }
      await c.query(
        `UPDATE hoa_don SET ghi_chu = concat_ws(E'\\n', ghi_chu, $2::text) WHERE id = $1`,
        [n(fd, 'hoa_don'), `Giảm ${vnd(tien)} cả hóa đơn: ${s(fd, 'ly_do')} (${nv.ho_ten}, ${new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })})`],
      )
      await kiemTraKhongAm(c, n(fd, 'hoa_don'))
    })
    return `Đã chia ${vnd(tien)} giảm giá xuống các dòng.`
  })
}

export async function thuTien(_: ActionState, fd: FormData): Promise<ActionState> {
  const nv = await requireNhanVien('le_tan')
  return run(async () => {
    const tien = n(fd, 'so_tien')
    if (!(tien > 0)) throw new Error('Số tiền thu phải lớn hơn 0.')
    const hinhThuc = s(fd, 'hinh_thuc')
    await tx(nv.id, (c) =>
      c.query('INSERT INTO thanh_toan (hoa_don_id, so_tien, hinh_thuc, ma_giao_dich, nguoi_thu_id, ghi_chu) VALUES ($1, $2, $3, $4, $5, $6)', [
        n(fd, 'hoa_don'), tien, hinhThuc, hinhThuc === 'chuyen_khoan' ? s(fd, 'ma_gd') || null : null, nv.id, s(fd, 'ghi_chu') || null,
      ]),
    )
    return `Đã thu ${vnd(tien)}.`
  })
}
