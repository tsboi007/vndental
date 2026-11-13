import type { SP } from '@/lib/api'
import { q } from '@/lib/db'
import { homNay, congNgay, str } from '@/lib/format'
import { requireNhanVien } from '@/lib/session'

export async function baoCao(sp: SP) {
  await requireNhanVien('quan_ly')
  // Mặc định: tháng trước (tháng đã khép lại)
  const thang = str(sp.thang) || congNgay(`${homNay().slice(0, 7)}-01`, -1).slice(0, 7)
  const dau = `${thang}-01`

  const [doanhThuBs, gheTrong, quaSauThang, huy, no, lieuTrinh, sapHet, soSanh, theoThang] = await Promise.all([
    // 1. Doanh thu theo bác sĩ
    q<{ ho_ten: string; doanh_thu: number }>(
      `SELECT nv.ho_ten, sum(ct.thanh_tien) AS doanh_thu FROM chi_tiet_hoa_don ct JOIN hoa_don hd ON hd.id = ct.hoa_don_id
       JOIN nhan_vien nv ON nv.id = ct.bac_si_id
       WHERE hd.lap_luc >= $1::date AND hd.lap_luc < $1::date + interval '1 month' GROUP BY nv.id ORDER BY doanh_thu DESC`,
      [dau],
    ),
    // 2. Ghế trống theo khung giờ (chỉ tính các ngày đã qua của tháng)
    q<{ ghe: string; ghe_id: number; gio_bat_dau: number; so_khung: number; so_trong: number }>(
      `WITH khung AS (
         SELECT d::date AS ngay, g.id AS ghe_id, g.ten AS ghe, t::time AS gio
         FROM generate_series($1::date, least($1::date + interval '1 month' - interval '1 day', current_date - 1), interval '1 day') d,
              generate_series(timestamp '2000-01-01 08:00', timestamp '2000-01-01 19:30', interval '30 minutes') t, ghe g
         WHERE g.dang_hoat_dong AND (extract(isodow FROM d) <> 7 OR t::time <= time '16:30'))
       SELECT k.ghe, k.ghe_id, extract(hour FROM k.gio)::int AS gio_bat_dau, count(*) AS so_khung,
              count(*) FILTER (WHERE NOT EXISTS (SELECT 1 FROM lich_hen lh WHERE lh.ghe_id = k.ghe_id AND lh.ngay = k.ngay
                                                AND lh.gio_bat_dau = k.gio AND lh.trang_thai <> 'da_huy')) AS so_trong
       FROM khung k GROUP BY k.ghe, k.ghe_id, extract(hour FROM k.gio) ORDER BY k.ghe_id, 3`,
      [dau],
    ),
    // 3. Quá 6 tháng chưa quay lại
    q<{ id: number; ho_ten: string; sdt: string; lan_cuoi: string }>(
      `SELECT bn.id, bn.ho_ten, bn.sdt, max(p.kham_luc) AS lan_cuoi FROM benh_nhan bn JOIN phieu_dieu_tri p ON p.benh_nhan_id = bn.id
       GROUP BY bn.id HAVING max(p.kham_luc) < now() - interval '6 months'
         AND NOT EXISTS (SELECT 1 FROM lich_hen lh WHERE lh.benh_nhan_id = bn.id AND lh.ngay >= current_date AND lh.trang_thai <> 'da_huy')
       ORDER BY lan_cuoi`,
    ),
    // 4. Hủy lịch: việc gì, lý do gì. "Không đến" tính chung (P6); dời lịch không phải bỏ lịch (P5).
    q<{ viec: string | null; ly_do_huy: string; ben_huy: string | null; n: number }>(
      `SELECT dv.ten AS viec,
              CASE WHEN lh.trang_thai = 'khong_den' THEN 'Không đến (không báo)' ELSE ld.ten END AS ly_do_huy,
              lh.ben_huy, count(*) AS n
       FROM lich_hen lh LEFT JOIN dich_vu dv ON dv.id = lh.dich_vu_id LEFT JOIN ly_do_huy ld ON ld.ma = lh.ly_do_huy_ma
       WHERE lh.trang_thai IN ('da_huy', 'khong_den') AND lh.ly_do_huy_ma IS DISTINCT FROM 'doi_lich'
         AND lh.ngay >= $1::date AND lh.ngay < $1::date + interval '1 month'
       GROUP BY 1, 2, 3`,
      [dau],
    ),
    // 5. Tổng nợ theo người
    q<{ benh_nhan_id: number; ho_ten: string; tong_no: number; so_hd: number }>(
      `SELECT cn.benh_nhan_id, bn.ho_ten, sum(cn.con_no) AS tong_no, count(*) AS so_hd FROM v_cong_no_hoa_don cn
       JOIN benh_nhan bn ON bn.id = cn.benh_nhan_id WHERE cn.con_no > 0 GROUP BY cn.benh_nhan_id, bn.ho_ten ORDER BY tong_no DESC`,
    ),
    // 6. Liệu trình đang dở
    q<{ lieu_trinh_id: number; ho_ten: string; ten: string; so_buoi_da_lam: number; tong_so_buoi: number; so_buoi_con_lai: number }>(
      'SELECT * FROM v_lieu_trinh_dang_do ORDER BY so_buoi_con_lai',
    ),
    // 7. Thuốc / vật tư sắp hết
    q<{ id: number; ten: string; ton_kho: number; nguong_dat_them: number }>('SELECT * FROM v_vat_tu_sap_het ORDER BY ton_kho / nullif(nguong_dat_them, 0)'),
    // 8. So với tháng trước
    q<{ thang_nay: number | null; thang_truoc: number | null }>(
      `SELECT sum(ct.thanh_tien) FILTER (WHERE hd.lap_luc >= $1::date) AS thang_nay,
              sum(ct.thanh_tien) FILTER (WHERE hd.lap_luc < $1::date) AS thang_truoc
       FROM chi_tiet_hoa_don ct JOIN hoa_don hd ON hd.id = ct.hoa_don_id
       WHERE hd.lap_luc >= $1::date - interval '1 month' AND hd.lap_luc < $1::date + interval '1 month'`,
      [dau],
    ),
    q<{ thang: string; doanh_thu: number }>(
      `SELECT to_char(date_trunc('month', hd.lap_luc), 'MM/YYYY') AS thang, sum(ct.thanh_tien) AS doanh_thu
       FROM chi_tiet_hoa_don ct JOIN hoa_don hd ON hd.id = ct.hoa_don_id
       WHERE hd.lap_luc >= $1::date - interval '5 months' AND hd.lap_luc < $1::date + interval '1 month'
       GROUP BY date_trunc('month', hd.lap_luc) ORDER BY date_trunc('month', hd.lap_luc)`,
      [dau],
    ),
  ])
  return { thang, doanhThuBs, gheTrong, quaSauThang, huy, no, lieuTrinh, sapHet, soSanh, theoThang }
}
