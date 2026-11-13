import type { SP } from '@/lib/api'
import { q, q1 } from '@/lib/db'
import { caTrucNgay, dsDichVu, timBenhNhan, type BenhNhan } from '@/lib/data'
import { homNay, str } from '@/lib/format'
import { requireNhanVien } from '@/lib/session'

// Đặt lịch: bệnh nhân đang chọn (hoặc kết quả tìm), ca trực bác sĩ, lịch đã có trong ngày, ghế, dịch vụ.
export async function lichHenDat(sp: SP) {
  await requireNhanVien('le_tan', 'bac_si')
  const p = { tim: str(sp.tim), bn: str(sp.bn), ngay: str(sp.ngay) || homNay() }
  const bn = p.bn ? ((await q1<BenhNhan>('SELECT * FROM benh_nhan WHERE id = $1', [Number(p.bn)])) ?? null) : null
  const ketQua = !bn && p.tim ? await timBenhNhan(p.tim, 20) : []
  const tomTat = bn
    ? ((await q1<{ lan_cuoi: string | null; sap_toi: string | null; con_no: number }>(
        `SELECT (SELECT max(kham_luc) FROM phieu_dieu_tri WHERE benh_nhan_id = $1) AS lan_cuoi,
                (SELECT min(ngay || ' ' || gio_bat_dau) FROM lich_hen WHERE benh_nhan_id = $1 AND ngay >= current_date AND trang_thai IN ('da_dat','da_nhac')) AS sap_toi,
                (SELECT coalesce(sum(con_no), 0) FROM v_cong_no_hoa_don WHERE benh_nhan_id = $1) AS con_no`,
        [bn.id],
      )) ?? null)
    : null
  const lieuTrinh = bn
    ? await q<{ lieu_trinh_id: number; ten: string; so_buoi_da_lam: number; tong_so_buoi: number }>(
        'SELECT lieu_trinh_id, ten, so_buoi_da_lam, tong_so_buoi FROM v_lieu_trinh_dang_do WHERE benh_nhan_id = $1',
        [bn.id],
      )
    : []
  const [ca, lich, ghe, dichVu] = await Promise.all([
    caTrucNgay(p.ngay),
    q<{ bac_si_id: number; ghe_id: number; gio_bat_dau: string }>(
      "SELECT bac_si_id, ghe_id, gio_bat_dau FROM lich_hen WHERE ngay = $1 AND trang_thai <> 'da_huy'",
      [p.ngay],
    ),
    q<{ id: number; ten: string }>('SELECT id, ten FROM ghe WHERE dang_hoat_dong ORDER BY id'),
    dsDichVu(),
  ])
  return { bn, ketQua, tomTat, lieuTrinh, ca, lich, ghe, dichVu }
}
