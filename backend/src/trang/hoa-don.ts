import type { SP } from '@/lib/api'
import { q } from '@/lib/db'
import { str } from '@/lib/format'
import { chiSo } from '@/lib/data'
import { requireNhanVien } from '@/lib/session'

export async function hoaDon(sp: SP) {
  await requireNhanVien('le_tan')
  const tim = str(sp.q).trim()

  // Chờ thanh toán: phiếu bác sĩ đã bấm hoàn tất, có việc lẻ hoặc thuốc, chưa có hóa đơn.
  // Buổi thuộc liệu trình không tính giá từng buổi (G11) — thu theo đợt ở màn Liệu trình.
  const cho = await q<{ id: number; kham_luc: string; ho_ten: string; bac_si: string; viec: string | null }>(
    `SELECT p.id, p.kham_luc, bn.ho_ten, bs.ho_ten AS bac_si,
            (SELECT string_agg(dv.ten || coalesce(' ' || ct.rang_so, ''), ' · ') FROM chi_tiet_dieu_tri ct JOIN dich_vu dv ON dv.id = ct.dich_vu_id WHERE ct.phieu_id = p.id) AS viec
     FROM phieu_dieu_tri p JOIN benh_nhan bn ON bn.id = p.benh_nhan_id JOIN nhan_vien bs ON bs.id = p.bac_si_chinh_id
     WHERE NOT EXISTS (SELECT 1 FROM hoa_don WHERE phieu_dieu_tri_id = p.id)
       AND (EXISTS (SELECT 1 FROM chi_tiet_dieu_tri WHERE phieu_id = p.id AND lieu_trinh_id IS NULL) OR EXISTS (SELECT 1 FROM don_thuoc WHERE phieu_id = p.id))
       AND p.trang_thai = 'hoan_tat'
       AND p.kham_luc > now() - interval '30 days'
     ORDER BY p.kham_luc`,
  )
  type Dong = { hoa_don_id: number; ma_hoa_don: string; lap_luc: string; ho_ten: string; sdt: string; tong_tien: number; da_thu: number; con_no: number }
  const chon = 'SELECT cn.*, bn.ho_ten, bn.sdt FROM v_cong_no_hoa_don cn JOIN benh_nhan bn ON bn.id = cn.benh_nhan_id'
  const ds = tim
    ? await q<Dong>(
        `${chon} WHERE cn.ma_hoa_don ILIKE $1 OR ($2 <> '' AND bn.sdt LIKE $2 || '%') OR bn.ho_ten ILIKE '%' || $1 || '%'
         ORDER BY cn.lap_luc DESC LIMIT 50`,
        [tim, chiSo(tim)],
      )
    : await q<Dong>(`${chon} WHERE cn.lap_luc::date = current_date ORDER BY cn.lap_luc DESC`)
  return { tim, cho, ds }
}
