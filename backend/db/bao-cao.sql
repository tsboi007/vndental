-- =====================================================================
-- TÁM CÂU QUẢN LÝ HỎI HẰNG THÁNG (UC22) — CSDL PhongKhamRang
-- Mỗi truy vấn có CTE "tham_so" ở đầu: đổi ngày trong đó để xem tháng khác
-- (mặc định: tháng hiện tại).
-- =====================================================================


-- 1. Tháng này mỗi bác sĩ làm ra bao nhiêu tiền
--    Doanh thu = tổng thành tiền dòng hóa đơn (sau giảm) lập trong tháng, theo bác sĩ của dòng (G6, QĐ1, QĐ3)
WITH tham_so AS (SELECT date_trunc('month', current_date)::date AS thang)

, dong AS (
    SELECT ct.bac_si_id, ct.hoa_don_id, ct.thanh_tien
    FROM chi_tiet_hoa_don ct
    JOIN hoa_don hd ON hd.id = ct.hoa_don_id
    CROSS JOIN tham_so t
    WHERE hd.lap_luc >= t.thang AND hd.lap_luc < t.thang + INTERVAL '1 month'
)
SELECT nv.id AS bac_si_id,
       nv.ho_ten,
       coalesce(sum(d.thanh_tien), 0)             AS doanh_thu,
       count(DISTINCT d.hoa_don_id)               AS so_hoa_don,
       count(d.hoa_don_id)                        AS so_dong
FROM nhan_vien nv
LEFT JOIN dong d ON d.bac_si_id = nv.id
WHERE nv.vai_tro = 'bac_si'
GROUP BY nv.id, nv.ho_ten
ORDER BY doanh_thu DESC;


-- 2. Ghế nào trống nhiều nhất, vào khung giờ nào
--    Khung có thể đặt (giờ mở cửa × ghế × các ngày trong tháng) − lịch hẹn không hủy
WITH tham_so AS (SELECT date_trunc('month', current_date)::date AS thang),
khung AS (
    SELECT d::date AS ngay, TIME '08:00' + make_interval(mins => 30 * k) AS gio
    FROM tham_so t,
         generate_series(t.thang, t.thang + INTERVAL '1 month' - INTERVAL '1 day', INTERVAL '1 day') d,
         generate_series(0, 23) k
    WHERE TIME '08:00' + make_interval(mins => 30 * k)
          <= CASE WHEN extract(isodow FROM d) = 7 THEN TIME '16:30' ELSE TIME '19:30' END
),
trong AS (
    SELECT g.ten AS ghe, k.gio
    FROM khung k CROSS JOIN ghe g
    WHERE g.dang_hoat_dong
      AND NOT EXISTS (SELECT 1 FROM lich_hen l
                      WHERE l.ghe_id = g.id AND l.ngay = k.ngay AND l.gio_bat_dau = k.gio
                        AND l.trang_thai <> 'da_huy')
)
SELECT ghe,
       to_char(gio, 'HH24:MI')                                   AS khung_gio,
       count(*)                                                  AS so_lan_trong,
       sum(count(*)) OVER (PARTITION BY ghe)                     AS tong_trong_cua_ghe
FROM trong
GROUP BY ghe, gio
ORDER BY tong_trong_cua_ghe DESC, ghe, so_lan_trong DESC, gio;


-- 3. Bệnh nhân nào quá sáu tháng chưa quay lại
SELECT bn.ma_ho_so, bn.ho_ten, bn.sdt, bn.sdt_la_cua,
       max(p.kham_luc)::date                          AS lan_kham_cuoi,
       current_date - max(p.kham_luc)::date           AS so_ngay
FROM benh_nhan bn
JOIN phieu_dieu_tri p ON p.benh_nhan_id = bn.id
GROUP BY bn.id
HAVING max(p.kham_luc) < current_date - INTERVAL '6 months'
   AND NOT EXISTS (SELECT 1 FROM lich_hen l               -- đã có hẹn sắp tới thì thôi nhắc
                   WHERE l.benh_nhan_id = bn.id AND l.ngay >= current_date AND l.trang_thai <> 'da_huy')
ORDER BY lan_kham_cuoi;


-- 4. Việc gì hay bị hủy lịch nhất, vì lý do gì (lịch "không đến" tính riêng)
WITH tham_so AS (SELECT date_trunc('month', current_date)::date AS thang)
SELECT coalesce(dv.ten, '(chưa ghi việc)')   AS viec,
       CASE WHEN l.trang_thai = 'khong_den' THEN 'Không đến (không báo)' ELSE ld.ten END AS ly_do,
       count(*)                               AS so_lich,
       sum(count(*)) OVER (PARTITION BY dv.id) AS tong_huy_cua_viec
FROM lich_hen l
CROSS JOIN tham_so t
LEFT JOIN dich_vu dv   ON dv.id = l.dich_vu_id
LEFT JOIN ly_do_huy ld ON ld.ma = l.ly_do_huy_ma
WHERE l.trang_thai IN ('da_huy', 'khong_den')
  AND l.ly_do_huy_ma IS DISTINCT FROM 'doi_lich'          -- dời lịch không phải bỏ lịch
  AND l.ngay >= t.thang AND l.ngay < t.thang + INTERVAL '1 month'
GROUP BY dv.id, dv.ten, 2
ORDER BY tong_huy_cua_viec DESC, viec, so_lich DESC;


-- 5. Tổng số tiền khách còn nợ, chia theo từng người
SELECT bn.ma_ho_so, bn.ho_ten, bn.sdt,
       count(*)                     AS so_hoa_don_no,
       sum(v.con_no)                AS tong_no,
       min(v.lap_luc)::date         AS no_tu_ngay,
       current_date - min(v.lap_luc)::date AS tuoi_no_ngay,
       sum(sum(v.con_no)) OVER ()   AS tong_no_toan_phong_kham
FROM v_cong_no_hoa_don v
JOIN benh_nhan bn ON bn.id = v.benh_nhan_id
WHERE v.con_no > 0
GROUP BY bn.id
ORDER BY tong_no DESC;


-- 6. Liệu trình nào đang dở, còn mấy buổi nữa
SELECT v.ten AS lieu_trinh, v.ho_ten, v.sdt,
       nv.ho_ten AS bac_si_phu_trach,
       v.so_buoi_da_lam, v.tong_so_buoi, v.so_buoi_con_lai,
       v.tong_chi_phi, v.da_lap_hoa_don,
       v.tong_chi_phi - v.da_lap_hoa_don AS con_phai_thu_theo_dot
FROM v_lieu_trinh_dang_do v
JOIN nhan_vien nv ON nv.id = v.bac_si_phu_trach_id
ORDER BY v.so_buoi_con_lai, v.ho_ten;


-- 7. Thuốc hay vật tư nào sắp hết
SELECT ma, ten,
       CASE loai WHEN 'thuoc' THEN 'Thuốc' ELSE 'Vật tư' END AS loai,
       ton_kho, nguong_dat_them, don_vi
FROM v_vat_tu_sap_het
ORDER BY ton_kho - nguong_dat_them, ten;


-- 8. So với tháng trước, doanh thu tăng giảm bao nhiêu phần trăm
WITH tham_so AS (SELECT date_trunc('month', current_date)::date AS thang),
dt AS (
    SELECT date_trunc('month', hd.lap_luc)::date AS thang, sum(ct.thanh_tien) AS doanh_thu
    FROM hoa_don hd JOIN chi_tiet_hoa_don ct ON ct.hoa_don_id = hd.id
    GROUP BY 1
)
SELECT t.thang                                       AS thang_nay,
       coalesce(nay.doanh_thu, 0)                    AS doanh_thu_thang_nay,
       coalesce(truoc.doanh_thu, 0)                  AS doanh_thu_thang_truoc,
       CASE WHEN coalesce(truoc.doanh_thu, 0) = 0 THEN NULL
            ELSE round((coalesce(nay.doanh_thu, 0) - truoc.doanh_thu) * 100.0 / truoc.doanh_thu, 1)
       END                                           AS phan_tram_thay_doi
FROM tham_so t
LEFT JOIN dt nay   ON nay.thang   = t.thang
LEFT JOIN dt truoc ON truoc.thang = (t.thang - INTERVAL '1 month')::date;
