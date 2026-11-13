-- =====================================================================
-- DỮ LIỆU MẪU — Phòng khám Nha khoa Nụ Cười Việt (CSDL PhongKhamRang)
-- Mọi ngày tháng tính theo current_date: chạy lúc nào cũng có lịch hôm nay,
-- lịch ngày mai (để nhắc), 60 ngày lịch sử cho báo cáo. Kết quả cố định nhờ setseed().
-- Chạy sau schema.sql trên CSDL trống.
-- =====================================================================

-- Danh mục ghế (3 ghế) và lý do hủy (9 lý do) đã được schema.sql nạp sẵn.

-- ---------------------------------------------------------------- nhân sự (4 bác sĩ, 2 lễ tân, 1 quản lý)
INSERT INTO nhan_vien (id, ho_ten, sdt, vai_tro, ten_dang_nhap, ban_thoi_gian) VALUES
    (1, 'Nguyễn Văn An',   '0901111001', 'bac_si',  'bs.an',     FALSE),
    (2, 'Trần Thanh Bình', '0901111002', 'bac_si',  'bs.binh',   FALSE),
    (3, 'Lê Bảo Chi',      '0901111003', 'bac_si',  'bs.chi',    FALSE),
    (4, 'Phạm Quốc Dũng',  '0901111004', 'bac_si',  'bs.dung',   TRUE),
    (5, 'Võ Thị Hoa',      '0901111005', 'le_tan',  'lt.hoa',    FALSE),
    (6, 'Đặng Ngọc Lan',   '0901111006', 'le_tan',  'lt.lan',    FALSE),
    (7, 'Hoàng Đức Minh',  '0901111007', 'quan_ly', 'ql.minh',   FALSE);
SELECT setval('nhan_vien_id_seq', 7);

-- Ca trực (G12): sáng 08:00–14:00, chiều 14:00–20:00; Chủ nhật 08:00–12:30 / 12:30–17:00.
-- Lặp theo thứ (1 = Thứ Hai … 7 = Chủ nhật), từ 70 ngày trước đến 28 ngày tới. BS Dũng bán thời gian: T3, T5, T7.
INSERT INTO ca_truc (nhan_vien_id, ngay, buoi, gio_bat_dau, gio_ket_thuc, nguoi_xep_id)
SELECT m.nv, d::date, m.buoi,
       CASE WHEN m.buoi = 'sang' THEN TIME '08:00' WHEN extract(isodow FROM d) = 7 THEN TIME '12:30' ELSE TIME '14:00' END,
       CASE WHEN m.buoi = 'chieu' THEN (CASE WHEN extract(isodow FROM d) = 7 THEN TIME '17:00' ELSE TIME '20:00' END)
            WHEN extract(isodow FROM d) = 7 THEN TIME '12:30' ELSE TIME '14:00' END,
       7
FROM generate_series(current_date - 70, current_date + 28, INTERVAL '1 day') d
JOIN (VALUES
    (1, 1, 'sang'), (1, 2, 'sang'), (1, 3, 'chieu'), (1, 4, 'sang'), (1, 5, 'sang'), (1, 6, 'sang'), (1, 6, 'chieu'),
    (2, 1, 'sang'), (2, 1, 'chieu'), (2, 2, 'chieu'), (2, 3, 'sang'), (2, 3, 'chieu'), (2, 4, 'chieu'), (2, 5, 'sang'), (2, 5, 'chieu'), (2, 7, 'sang'),
    (3, 1, 'chieu'), (3, 2, 'sang'), (3, 3, 'sang'), (3, 4, 'chieu'), (3, 5, 'chieu'), (3, 6, 'sang'), (3, 7, 'chieu'),
    (4, 2, 'sang'), (4, 2, 'chieu'), (4, 4, 'sang'), (4, 4, 'chieu'), (4, 6, 'chieu'),
    (5, 1, 'sang'), (5, 2, 'sang'), (5, 3, 'sang'), (5, 4, 'sang'), (5, 5, 'sang'), (5, 6, 'sang'), (5, 7, 'sang'),
    (6, 1, 'chieu'), (6, 2, 'chieu'), (6, 3, 'chieu'), (6, 4, 'chieu'), (6, 5, 'chieu'), (6, 6, 'chieu'), (6, 7, 'chieu')
) AS m(nv, thu, buoi) ON m.thu = extract(isodow FROM d);

-- ---------------------------------------------------------------- dịch vụ & bảng giá
INSERT INTO dich_vu (id, ma, ten, nhom, don_vi, theo_rang) VALUES
    (1,  'KHAM',  'Khám tổng quát',                 'kham',       'lần',  FALSE),
    (2,  'CVOI',  'Cạo vôi răng',                   'nha_chu',    'lần',  FALSE),
    (3,  'TRAM',  'Trám răng',                      'phuc_hoi',   'răng', TRUE),
    (4,  'NHO',   'Nhổ răng',                       'phau_thuat', 'răng', TRUE),
    (5,  'NHOK',  'Nhổ răng khôn',                  'phau_thuat', 'răng', TRUE),
    (6,  'LTUY',  'Lấy tủy răng',                   'noi_nha',    'răng', TRUE),
    (7,  'BSU',   'Bọc răng sứ',                    'phuc_hinh',  'răng', TRUE),
    (8,  'TTR',   'Tẩy trắng răng',                 'tham_my',    'ca',   FALSE),
    (9,  'IMP',   'Cắm implant',                    'implant',    'răng', TRUE),
    (10, 'TKLT',  'Tái khám trong liệu trình',      'lieu_trinh', 'lần',  FALSE),
    (11, 'CPHIM', 'Chụp phim X-quang',              'chan_doan',  'lần',  FALSE);
SELECT setval('dich_vu_id_seq', 11);

INSERT INTO bang_gia (dich_vu_id, don_gia, hieu_luc_tu, hieu_luc_den, nguoi_cap_nhat) VALUES
    (1, 100000,   '2025-01-01', NULL, 7),
    (2, 200000,   '2025-01-01', NULL, 7),
    (3, 300000,   '2025-01-01', current_date - 30, 7),   -- giá cũ (L5)
    (3, 350000,   current_date - 30, NULL, 7),
    (4, 500000,   '2025-01-01', NULL, 7),
    (5, 1500000,  '2025-01-01', NULL, 7),
    (6, 1200000,  '2025-01-01', NULL, 7),
    (7, 3000000,  '2025-01-01', NULL, 7),
    (8, 2500000,  '2025-01-01', NULL, 7),
    (9, 18000000, '2025-01-01', NULL, 7),
    (10, 0,       '2025-01-01', NULL, 7),
    (11, 150000,  '2025-01-01', NULL, 7);

-- ---------------------------------------------------------------- thuốc & vật tư (G5, P8)
INSERT INTO vat_tu (id, ma, ten, loai, don_vi, nguong_dat_them, gia_ban) VALUES
    (1, 'PARA', 'Paracetamol 500mg',    'thuoc',  'viên', 20, 2000),
    (2, 'AMOX', 'Amoxicillin 500mg',    'thuoc',  'viên', 30, 3000),
    (3, 'IBU',  'Ibuprofen 400mg',      'thuoc',  'viên', 20, 2500),
    (4, 'CHLO', 'Nước súc miệng Chlorhexidine', 'thuoc', 'chai', 5, 45000),
    (5, 'LIDO', 'Thuốc tê Lidocain 2%', 'vat_tu', 'ống',  10, NULL),
    (6, 'COMP', 'Composite A2',         'vat_tu', 'ống',  3,  NULL),
    (7, 'GANG', 'Găng tay y tế size M', 'vat_tu', 'hộp',  2,  NULL),
    (8, 'KHAU', 'Khẩu trang y tế',      'vat_tu', 'hộp',  3,  NULL),
    (9, 'MCAI', 'Mắc cài kim loại',     'vat_tu', 'bộ',   2,  NULL);
SELECT setval('vat_tu_id_seq', 9);

INSERT INTO giao_dich_kho (vat_tu_id, loai, so_luong, nhan_vien_id, thoi_diem, ghi_chu)
SELECT id, 'nhap', sl, 7, current_date - 80 + TIME '09:00', 'Tồn đầu kỳ'
FROM vat_tu JOIN (VALUES (1, 20000), (2, 800), (3, 400), (4, 40), (5, 200), (6, 30), (7, 20), (8, 30), (9, 10)) v(id, sl) USING (id);

-- ---------------------------------------------------------------- bệnh nhân
-- 1–6: minh họa (gia đình dùng chung số 0909000111 — QĐ2; niềng răng; implant)
INSERT INTO benh_nhan (id, ma_ho_so, ma_ho_so_giay, ho_ten, ngay_sinh, gioi_tinh, sdt, sdt_la_cua, ten_nguoi_giam_ho, dia_chi, di_ung, tien_su_benh, nguoi_tao_id, tao_luc) VALUES
    (1, 'BN00001', NULL,           'Nguyễn Thị Mai', '1985-03-02', 'F', '0909000111', NULL,  NULL,             '12 Lê Lợi, P. 7, TP. Vũng Tàu', NULL,         NULL,                5, current_date - 300 + TIME '09:00'),
    (2, 'BN00002', NULL,           'Trần Gia Bảo',   '2016-05-01', 'M', '0909000111', 'mẹ',  'Nguyễn Thị Mai', '12 Lê Lợi, P. 7, TP. Vũng Tàu', 'Penicillin', NULL,                5, current_date - 300 + TIME '09:05'),
    (3, 'BN00003', NULL,           'Trần Gia Hân',   '2018-07-09', 'F', '0909000111', 'mẹ',  'Nguyễn Thị Mai', '12 Lê Lợi, P. 7, TP. Vũng Tàu', NULL,         NULL,                5, current_date - 300 + TIME '09:10'),
    (4, 'BN00004', 'HS-2019-0387', 'Lê Văn Tâm',     '1970-01-01', 'M', '0912345678', NULL,  NULL,             '45 Ba Cu, TP. Vũng Tàu',        NULL,         NULL,                5, current_date - 90 + TIME '08:00'),
    (5, 'BN00005', NULL,           'La Thu Trang',   '1992-11-20', 'F', '0938552104', NULL,  NULL,             '8 Hoàng Hoa Thám, TP. Vũng Tàu', NULL,        'Tiểu đường type 2', 6, current_date - 60 + TIME '19:00'),
    (6, 'BN00006', 'HS-2020-1142', 'Mạc Văn Thành',  '1965-06-15', 'M', '0976330919', NULL,  NULL,             '102 Nguyễn An Ninh, TP. Vũng Tàu', NULL,      'Cao huyết áp',      5, current_date - 200 + TIME '10:00');

-- 7–300: sinh tự động (241–300 chỉ có lần khám cũ hơn 6 tháng — báo cáo câu 3)
INSERT INTO benh_nhan (id, ma_ho_so, ho_ten, ngay_sinh, gioi_tinh, sdt, nguoi_tao_id, tao_luc)
SELECT i,
       'BN' || lpad(i::text, 5, '0'),
       ho || ' ' || CASE WHEN nam THEN dem_nam ELSE dem_nu END || ' ' || CASE WHEN nam THEN ten_nam ELSE ten_nu END,
       DATE '1955-01-01' + ((abs(hashtext('ns' || i)::bigint) % 22000)::int),
       CASE WHEN nam THEN 'M' ELSE 'F' END,
       '09' || lpad(((abs(hashtext('sdt' || i)::bigint) % 100000000)::int)::text, 8, '0'),
       5,
       current_date - 420 + ((abs(hashtext('tl' || i)::bigint) % 300)::int) + TIME '09:00'
FROM (
    SELECT i, ((abs(hashtext('gt' || i)::bigint) % 2)::int = 0) AS nam,
           (ARRAY['Nguyễn','Trần','Lê','Phạm','Hoàng','Huỳnh','Phan','Vũ','Võ','Đặng','Bùi','Đỗ','Hồ','Ngô','Dương','Lý'])[1 + (abs(hashtext('h' || i)::bigint) % 16)::int] AS ho,
           (ARRAY['Văn','Hữu','Đức','Minh','Quang','Thành','Công'])[1 + (abs(hashtext('d' || i)::bigint) % 7)::int] AS dem_nam,
           (ARRAY['Thị','Ngọc','Thu','Mỹ','Thanh','Kim'])[1 + (abs(hashtext('d' || i)::bigint) % 6)::int] AS dem_nu,
           (ARRAY['An','Bình','Cường','Dũng','Hải','Hùng','Khoa','Long','Nam','Phúc','Quân','Sơn','Tâm','Thắng','Tuấn','Việt'])[1 + (abs(hashtext('t' || i)::bigint) % 16)::int] AS ten_nam,
           (ARRAY['Anh','Chi','Dung','Hà','Hạnh','Hoa','Hương','Lan','Linh','Mai','Ngọc','Nhung','Phương','Thảo','Trang','Vy'])[1 + (abs(hashtext('t' || i)::bigint) % 16)::int] AS ten_nu
    FROM generate_series(7, 300) i
) x;
SELECT setval('benh_nhan_id_seq', 300);

-- ---------------------------------------------------------------- hàm phụ: lập hóa đơn cho một phiếu (giá chốt theo ngày khám — L5)
CREATE FUNCTION _seed_hoa_don(p_phieu INT, p_nguoi INT, p_lap TIMESTAMP, p_tra FLOAT) RETURNS VOID LANGUAGE plpgsql AS $$
DECLARE
    v_hd INT;
    v_bn INT;
    v_bs INT;
    v_tong NUMERIC;
BEGIN
    SELECT benh_nhan_id, bac_si_chinh_id INTO v_bn, v_bs FROM phieu_dieu_tri WHERE id = p_phieu;
    INSERT INTO hoa_don (id, ma_hoa_don, benh_nhan_id, phieu_dieu_tri_id, nguoi_lap_id, lap_luc)
    SELECT n, 'HD' || lpad(n::text, 5, '0'), v_bn, p_phieu, p_nguoi, p_lap FROM nextval('hoa_don_id_seq') n
    RETURNING id INTO v_hd;

    INSERT INTO chi_tiet_hoa_don (hoa_don_id, chi_tiet_dieu_tri_id, mo_ta, so_luong, don_gia, bac_si_id)
    SELECT v_hd, ct.id, dv.ten || coalesce(' — R' || ct.rang_so, ''), ct.so_luong, gia_tai_ngay(ct.dich_vu_id, p_lap::date), ct.bac_si_thuc_hien_id
    FROM chi_tiet_dieu_tri ct JOIN dich_vu dv ON dv.id = ct.dich_vu_id
    WHERE ct.phieu_id = p_phieu AND ct.lieu_trinh_id IS NULL;

    INSERT INTO chi_tiet_hoa_don (hoa_don_id, don_thuoc_id, mo_ta, so_luong, don_gia, bac_si_id)
    SELECT v_hd, dt.id, vt.ten, dt.so_luong, coalesce(vt.gia_ban, 0), v_bs
    FROM don_thuoc dt JOIN vat_tu vt ON vt.id = dt.vat_tu_id
    WHERE dt.phieu_id = p_phieu;

    IF random() < 0.1 THEN       -- QĐ3: giảm giá ghi theo dòng
        UPDATE chi_tiet_hoa_don SET giam_gia = round(so_luong * don_gia * 0.1, -3)
        WHERE hoa_don_id = v_hd AND chi_tiet_dieu_tri_id IS NOT NULL;
    END IF;

    SELECT coalesce(sum(thanh_tien), 0) INTO v_tong FROM chi_tiet_hoa_don WHERE hoa_don_id = v_hd;
    IF v_tong > 0 AND p_tra > 0 THEN
        INSERT INTO thanh_toan (hoa_don_id, so_tien, hinh_thuc, ma_giao_dich, nguoi_thu_id, thu_luc)
        SELECT v_hd, least(v_tong, greatest(1000, round(v_tong * p_tra::numeric, -3))), ht,
               CASE WHEN ht = 'chuyen_khoan' THEN 'FT' || to_char(p_lap, 'YYMMDD') || lpad(v_hd::text, 5, '0') END,
               p_nguoi, p_lap + INTERVAL '5 minutes'
        FROM (SELECT CASE WHEN random() < 0.6 THEN 'tien_mat' ELSE 'chuyen_khoan' END AS ht) h;
    END IF;
END $$;

-- ---------------------------------------------------------------- lịch hẹn, phiếu, hóa đơn: 60 ngày qua + 10 ngày tới
DO $seed$
DECLARE
    d DATE;
    i INT;
    c INT;
    t TIME;
    bs INT;
    bn INT;
    dv INT;
    st TEXT;
    ly_do TEXT;
    r FLOAT;
    lh INT;
    ph INT;
    kham TIMESTAMP;
    le_tan INT;
    bay_gio TIME := localtime;
    dvs INT[] := ARRAY[1, 1, 2, 2, 3, 3, 3, 4, 4, 5, 6, 7, 8, 11];
BEGIN
    PERFORM setseed(0.2026);
    FOR d IN SELECT generate_series(current_date - 60, current_date + 10, INTERVAL '1 day')::date LOOP
        FOR i IN 0..23 LOOP
            t := TIME '08:00' + make_interval(mins => i * 30);
            CONTINUE WHEN extract(isodow FROM d) = 7 AND t > TIME '16:30';
            le_tan := CASE WHEN t < (CASE WHEN extract(isodow FROM d) = 7 THEN TIME '12:30' ELSE TIME '14:00' END) THEN 5 ELSE 6 END;
            FOR c IN 1..3 LOOP
                CONTINUE WHEN random() < CASE WHEN d > current_date + 1 THEN 0.8 ELSE 0.38 END;
                bs := NULL;
                SELECT ct.nhan_vien_id INTO bs
                FROM ca_truc ct JOIN nhan_vien nv ON nv.id = ct.nhan_vien_id
                WHERE nv.vai_tro = 'bac_si' AND ct.ngay = d
                  AND ct.gio_bat_dau <= t AND ct.gio_ket_thuc >= t + INTERVAL '30 minutes'
                  AND NOT EXISTS (SELECT 1 FROM lich_hen x WHERE x.bac_si_id = ct.nhan_vien_id AND x.ngay = d
                                  AND x.gio_bat_dau = t AND x.trang_thai <> 'da_huy')
                ORDER BY random() LIMIT 1;
                CONTINUE WHEN bs IS NULL;

                bn := 7 + floor(random() * 234)::int;
                dv := dvs[1 + floor(random() * array_length(dvs, 1))::int];
                r := random();
                IF d < current_date OR (d = current_date AND t + INTERVAL '30 minutes' <= bay_gio) THEN
                    st := CASE WHEN r < 0.06 THEN 'da_huy' WHEN r < 0.10 THEN 'khong_den' ELSE 'hoan_thanh' END;
                ELSIF d = current_date AND t <= bay_gio THEN
                    st := 'da_den';
                ELSIF d = current_date THEN
                    st := CASE WHEN r < 0.85 THEN 'da_nhac' ELSE 'da_dat' END;
                ELSIF d = current_date + 1 THEN
                    st := CASE WHEN r < 0.04 THEN 'da_huy' WHEN r < 0.45 THEN 'da_nhac' ELSE 'da_dat' END;
                ELSE
                    st := CASE WHEN r < 0.04 THEN 'da_huy' ELSE 'da_dat' END;
                END IF;

                ly_do := CASE WHEN st = 'da_huy' THEN (ARRAY['ban_viec', 'ban_viec', 'ban_viec', 'om', 'quen_lich',
                              'quen_lich', 'doi_y', 'chi_phi', 'bac_si_vang', 'thiet_bi', 'khac'])[1 + floor(random() * 11)::int] END;

                INSERT INTO lich_hen (benh_nhan_id, bac_si_id, ghe_id, ngay, gio_bat_dau, dich_vu_id, trang_thai,
                                      nguoi_dat_id, dat_luc, den_luc, ly_do_huy_ma, ben_huy, nguoi_ghi_huy_id, huy_luc)
                VALUES (bn, bs, c, d, t, dv, st, le_tan, d - 5 + TIME '10:00',
                        CASE WHEN st IN ('da_den', 'hoan_thanh') THEN d + t - INTERVAL '5 minutes' END,
                        ly_do,
                        CASE WHEN ly_do IN ('bac_si_vang', 'thiet_bi') THEN 'phong_kham' WHEN ly_do IS NOT NULL THEN 'benh_nhan' END,
                        CASE WHEN ly_do IS NOT NULL THEN le_tan END,
                        CASE WHEN ly_do IS NOT NULL THEN d - 1 + TIME '15:30' END)
                RETURNING id INTO lh;

                IF st IN ('da_nhac', 'hoan_thanh', 'da_den', 'khong_den') THEN
                    INSERT INTO nhac_lich (lich_hen_id, kenh, ket_qua, nhan_vien_id, thoi_diem)
                    VALUES (lh, 'goi_dien', 'nghe_may', 6, d - 1 + TIME '15:00');
                END IF;

                IF st = 'hoan_thanh' OR (st = 'da_den' AND random() < 0.5) THEN
                    PERFORM set_config('app.nhan_vien_id', bs::text, TRUE);
                    kham := d + t + INTERVAL '5 minutes';
                    INSERT INTO phieu_dieu_tri (benh_nhan_id, lich_hen_id, bac_si_chinh_id, ghe_id, kham_luc, chan_doan, trang_thai, hoan_tat_luc, tao_luc)
                    VALUES (bn, lh, bs, c, kham,
                            (SELECT CASE dv WHEN 1 THEN 'Khám định kỳ' WHEN 2 THEN 'Cao răng độ 1' WHEN 3 THEN 'Sâu răng' WHEN 4 THEN 'Răng lung lay độ 3'
                                    WHEN 5 THEN 'Răng khôn mọc lệch' WHEN 6 THEN 'Viêm tủy' WHEN 7 THEN 'Răng vỡ lớn sau lấy tủy' WHEN 8 THEN 'Răng nhiễm màu nhẹ'
                                    ELSE 'Cần chụp phim kiểm tra' END),
                            CASE WHEN st = 'hoan_thanh' THEN 'hoan_tat' ELSE 'dang_kham' END,
                            CASE WHEN st = 'hoan_thanh' THEN kham + INTERVAL '25 minutes' END,
                            kham) RETURNING id INTO ph;
                    INSERT INTO chi_tiet_dieu_tri (phieu_id, dich_vu_id, rang_so, bac_si_thuc_hien_id)
                    VALUES (ph, dv, CASE WHEN dv IN (3, 4, 5, 6, 7) THEN (1 + floor(random() * 4)::int) * 10 + 1 + floor(random() * 8)::int END, bs);
                    IF dv IN (4, 5, 6) THEN
                        INSERT INTO don_thuoc (phieu_id, vat_tu_id, lieu_dung, so_luong)
                        VALUES (ph, 1, 'Ngày 2 lần, mỗi lần 1 viên sau ăn', 10);
                    END IF;
                    -- Hôm nay: khoảng một nửa số phiếu hoàn tất còn chờ lễ tân lập hóa đơn
                    IF st = 'hoan_thanh' AND (d < current_date OR random() < 0.5) THEN
                        r := random();
                        PERFORM _seed_hoa_don(ph, le_tan, kham + INTERVAL '40 minutes',
                                              CASE WHEN r < 0.94 THEN 1 WHEN r < 0.985 THEN 0.5 ELSE 0 END);
                    END IF;
                END IF;
            END LOOP;
        END LOOP;
    END LOOP;

    -- Bệnh nhân 241–300: lần khám cuối cách đây 7–13 tháng
    FOR bn IN 241..300 LOOP
        d := current_date - (200 + floor(random() * 200)::int);
        bs := 1 + floor(random() * 3)::int;
        PERFORM set_config('app.nhan_vien_id', bs::text, TRUE);
        INSERT INTO phieu_dieu_tri (benh_nhan_id, bac_si_chinh_id, ghe_id, kham_luc, chan_doan, trang_thai, hoan_tat_luc, tao_luc)
        VALUES (bn, bs, 1 + floor(random() * 3)::int, d + TIME '09:05', 'Cao răng', 'hoan_tat', d + TIME '09:30', d + TIME '09:05') RETURNING id INTO ph;
        INSERT INTO chi_tiet_dieu_tri (phieu_id, dich_vu_id, bac_si_thuc_hien_id) VALUES (ph, 2, bs);
        PERFORM _seed_hoa_don(ph, 5, d + TIME '09:45', 1);
    END LOOP;
END $seed$;

-- ---------------------------------------------------------------- liệu trình (L6, G11)
-- Lê Văn Tâm: niềng 20 buổi, đã làm 3 buổi, đã thu đợt 1. La Thu Trang: implant 4 buổi, đợt 1 mới thu một nửa.
INSERT INTO lieu_trinh (id, benh_nhan_id, bac_si_phu_trach_id, loai, ten, tong_so_buoi, tong_chi_phi, ngay_bat_dau, ghi_chu)
VALUES (1, 4, 1, 'nieng_rang', 'Niềng mắc cài kim loại 2 hàm', 20, 30000000, current_date - 55, 'Tháo mắc cài dự kiến sau 24 tháng'),
       (2, 5, 3, 'implant',    'Cắm implant răng 36',          4,  18000000, current_date - 40, NULL);
SELECT setval('lieu_trinh_id_seq', 2);

INSERT INTO lieu_trinh_dot (lieu_trinh_id, dot_so, so_tien, mo_ta, han_thanh_toan) VALUES
    (1, 1, 10000000, 'Đặt cọc',                  current_date - 55),
    (1, 2, 10000000, 'Gắn mắc cài hàm dưới',     current_date + 20),
    (1, 3, 10000000, 'Tháo mắc cài',             current_date + 600),
    (2, 1, 9000000,  'Cắm trụ',                  current_date - 40),
    (2, 2, 9000000,  'Gắn răng sứ trên implant', current_date + 50);

DO $lt$
DECLARE
    ph INT;
    hd INT;
    k INT;
    v_ngay DATE;
BEGIN
    -- Niềng: buổi 1–3 (không qua lịch hẹn ngẫu nhiên; ghế 2, đầu giờ sáng)
    FOR k IN 1..3 LOOP
        v_ngay := current_date - 55 + (k - 1) * 21;
        PERFORM set_config('app.nhan_vien_id', '1', TRUE);
        INSERT INTO phieu_dieu_tri (benh_nhan_id, bac_si_chinh_id, ghe_id, kham_luc, chan_doan, ghi_chu, trang_thai, hoan_tat_luc, tao_luc)
        VALUES (4, 1, 2, v_ngay + TIME '07:35', 'Răng chen chúc, khớp cắn hạng II',
                CASE k WHEN 1 THEN 'Gắn mắc cài hàm trên' ELSE 'Siết dây cung' END,
                'hoan_tat', v_ngay + TIME '07:58', v_ngay + TIME '07:35')
        RETURNING id INTO ph;
        INSERT INTO chi_tiet_dieu_tri (phieu_id, dich_vu_id, bac_si_thuc_hien_id, lieu_trinh_id, buoi_thu, ghi_chu)
        VALUES (ph, 10, 1, 1, k, CASE k WHEN 1 THEN 'Gắn mắc cài hàm trên' ELSE 'Siết dây cung' END);
        IF k = 1 THEN
            INSERT INTO giao_dich_kho (vat_tu_id, loai, so_luong, phieu_id, nhan_vien_id, thoi_diem)
            VALUES (9, 'xuat_dung', -1, ph, 1, v_ngay + TIME '07:40');
            INSERT INTO hoa_don (id, ma_hoa_don, benh_nhan_id, phieu_dieu_tri_id, nguoi_lap_id, lap_luc, ghi_chu)
            SELECT n, 'HD' || lpad(n::text, 5, '0'), 4, ph, 5, v_ngay + TIME '08:05', 'Thu đợt 1 liệu trình niềng' FROM nextval('hoa_don_id_seq') n
            RETURNING id INTO hd;
            INSERT INTO chi_tiet_hoa_don (hoa_don_id, lieu_trinh_dot_id, mo_ta, don_gia, bac_si_id)
            SELECT hd, id, 'Niềng răng — đợt 1: Đặt cọc', so_tien, 1 FROM lieu_trinh_dot WHERE lieu_trinh_id = 1 AND dot_so = 1;
            INSERT INTO thanh_toan (hoa_don_id, so_tien, hinh_thuc, ma_giao_dich, nguoi_thu_id, thu_luc)
            VALUES (hd, 10000000, 'chuyen_khoan', 'FT' || to_char(v_ngay, 'YYMMDD') || '00001', 5, v_ngay + TIME '08:10');
        END IF;
    END LOOP;

    -- Implant: buổi 1 (cắm trụ R36) và buổi 2 (tái khám); đợt 1 thu một nửa → còn nợ
    FOR k IN 1..2 LOOP
        v_ngay := current_date - 40 + (k - 1) * 14;
        PERFORM set_config('app.nhan_vien_id', '3', TRUE);
        INSERT INTO phieu_dieu_tri (benh_nhan_id, bac_si_chinh_id, ghe_id, kham_luc, chan_doan, ghi_chu, trang_thai, hoan_tat_luc, tao_luc)
        VALUES (5, 3, 3, v_ngay + TIME '07:35', 'Mất răng 36',
                CASE k WHEN 1 THEN 'Cắm trụ implant 36' ELSE 'Kiểm tra lành thương' END,
                'hoan_tat', v_ngay + TIME '07:58', v_ngay + TIME '07:35')
        RETURNING id INTO ph;
        INSERT INTO chi_tiet_dieu_tri (phieu_id, dich_vu_id, rang_so, bac_si_thuc_hien_id, lieu_trinh_id, buoi_thu)
        VALUES (ph, CASE k WHEN 1 THEN 9 ELSE 10 END, CASE k WHEN 1 THEN 36 END, 3, 2, k);
        IF k = 1 THEN
            INSERT INTO giao_dich_kho (vat_tu_id, loai, so_luong, phieu_id, nhan_vien_id, thoi_diem)
            VALUES (5, 'xuat_dung', -2, ph, 3, v_ngay + TIME '07:40');
            INSERT INTO don_thuoc (phieu_id, vat_tu_id, lieu_dung, so_luong)
            VALUES (ph, 2, 'Ngày 3 lần, mỗi lần 1 viên, 5 ngày', 15);
            INSERT INTO hoa_don (id, ma_hoa_don, benh_nhan_id, phieu_dieu_tri_id, nguoi_lap_id, lap_luc, ghi_chu)
            SELECT n, 'HD' || lpad(n::text, 5, '0'), 5, ph, 5, v_ngay + TIME '08:05', 'Thu đợt 1 implant' FROM nextval('hoa_don_id_seq') n
            RETURNING id INTO hd;
            INSERT INTO chi_tiet_hoa_don (hoa_don_id, lieu_trinh_dot_id, mo_ta, don_gia, bac_si_id)
            SELECT hd, id, 'Implant — đợt 1: Cắm trụ', so_tien, 3 FROM lieu_trinh_dot WHERE lieu_trinh_id = 2 AND dot_so = 1;
            INSERT INTO chi_tiet_hoa_don (hoa_don_id, don_thuoc_id, mo_ta, so_luong, don_gia, bac_si_id)
            SELECT hd, dt.id, 'Amoxicillin 500mg', 15, 3000, 3 FROM don_thuoc dt WHERE dt.phieu_id = ph;
            INSERT INTO thanh_toan (hoa_don_id, so_tien, hinh_thuc, nguoi_thu_id, thu_luc)
            VALUES (hd, 4500000, 'tien_mat', 5, v_ngay + TIME '08:10');
        END IF;
    END LOOP;

    -- Lịch hẹn minh họa sắp tới (bỏ qua khung đã có người vì dữ liệu sinh ngẫu nhiên)
    FOR k IN 0..60 LOOP
        BEGIN
            INSERT INTO lich_hen (benh_nhan_id, bac_si_id, ghe_id, ngay, gio_bat_dau, dich_vu_id, lieu_trinh_id, buoi_thu, noi_dung, trang_thai, nguoi_dat_id, dat_luc)
            SELECT 4, 1, 1 + k % 3, current_date + 2 + k / 18, TIME '08:00' + make_interval(mins => 30 * ((k / 3) % 6)), 10, 1, 4, 'Siết dây cung', 'da_dat', 5, current_date - 13 + TIME '08:10';
            EXIT;
        EXCEPTION WHEN others THEN NULL;
        END;
    END LOOP;
    FOR k IN 0..60 LOOP
        BEGIN
            INSERT INTO lich_hen (benh_nhan_id, bac_si_id, ghe_id, ngay, gio_bat_dau, dich_vu_id, noi_dung, trang_thai, nguoi_dat_id, dat_luc)
            SELECT 2, b.id, 1 + k % 3, current_date + 1, TIME '08:00' + make_interval(mins => 30 * (k / 6)), 3, 'Trám răng sữa', 'da_dat', 5, current_date - 2 + TIME '10:00'
            FROM (SELECT (ARRAY[1, 2])[1 + (k / 3) % 2] AS id) b;
            EXIT;
        EXCEPTION WHEN others THEN NULL;
        END;
    END LOOP;
END $lt$;
SELECT setval('hoa_don_id_seq', (SELECT max(id) FROM hoa_don));

-- ---------------------------------------------------------------- dời lịch (P5): một lịch ngày kia dời sang tuần sau
DO $doi$
DECLARE
    v_cu RECORD;
    k INT;
BEGIN
    SELECT * INTO v_cu FROM lich_hen
    WHERE ngay = current_date + 2 AND trang_thai = 'da_dat' AND benh_nhan_id > 6 ORDER BY gio_bat_dau, id LIMIT 1;
    IF v_cu.id IS NULL THEN RETURN; END IF;
    UPDATE lich_hen SET trang_thai = 'da_huy', ly_do_huy_ma = 'doi_lich', ghi_chu_huy = 'Khách xin dời sang tuần sau',
           ben_huy = 'benh_nhan', nguoi_ghi_huy_id = 5, huy_luc = current_date - 1 + TIME '10:20'
    WHERE id = v_cu.id;
    FOR k IN 0..40 LOOP
        BEGIN
            INSERT INTO lich_hen (benh_nhan_id, bac_si_id, ghe_id, ngay, gio_bat_dau, dich_vu_id, noi_dung, trang_thai, doi_tu_lich_hen_id, nguoi_dat_id, dat_luc)
            VALUES (v_cu.benh_nhan_id, v_cu.bac_si_id, 1 + k % 3, current_date + 9, TIME '08:00' + make_interval(mins => 30 * (k / 3)),
                    v_cu.dich_vu_id, 'Lịch dời', 'da_dat', v_cu.id, 5, current_date - 1 + TIME '10:21');
            EXIT;
        EXCEPTION WHEN others THEN NULL;
        END;
    END LOOP;
END $doi$;

-- ---------------------------------------------------------------- nhắc lịch ngày mai: vài người không nghe máy (UC03)
INSERT INTO nhac_lich (lich_hen_id, kenh, ket_qua, nhan_vien_id, ma_tin_nhan, ghi_chu, thoi_diem)
SELECT id, 'goi_dien', 'khong_nghe', 6, NULL, 'Gọi 2 lần không nghe máy', current_date + TIME '15:05'
FROM lich_hen WHERE ngay = current_date + 1 AND trang_thai = 'da_dat' ORDER BY gio_bat_dau, id LIMIT 4;
INSERT INTO nhac_lich (lich_hen_id, kenh, ket_qua, nhan_vien_id, ma_tin_nhan, thoi_diem)
SELECT lich_hen_id, 'tin_nhan', 'da_gui', NULL, 'SMS' || lpad(lich_hen_id::text, 7, '0'), current_date + TIME '15:10'
FROM nhac_lich WHERE ket_qua = 'khong_nghe' ORDER BY lich_hen_id LIMIT 2;

-- ---------------------------------------------------------------- tồn kho cuối: vài món chạm ngưỡng (L14)
INSERT INTO giao_dich_kho (vat_tu_id, loai, so_luong, nhan_vien_id, thoi_diem, ghi_chu)
SELECT vt.id, 'dieu_chinh', v.muc - vt.ton_kho, 7, current_date - 1 + TIME '18:00', 'Kiểm kê cuối ngày'
FROM vat_tu vt JOIN (VALUES ('PARA', 18), ('COMP', 2), ('GANG', 1), ('LIDO', 6)) v(ma, muc) ON v.ma = vt.ma
WHERE v.muc <> vt.ton_kho;

-- ---------------------------------------------------------------- đối soát két các ngày đã qua (UC17)
INSERT INTO doi_soat_cuoi_ngay (ngay, tien_mat_he_thong, tien_mat_dem_duoc, nguoi_doi_soat_id, doi_soat_luc, ghi_chu)
SELECT ngay, tong, tong - CASE WHEN rn % 17 = 0 THEN 20000 ELSE 0 END, 6, ngay + TIME '20:10',
       CASE WHEN rn % 17 = 0 THEN 'Thối nhầm cho khách, đã báo quản lý' END
FROM (
    SELECT thu_luc::date AS ngay, sum(so_tien) AS tong, row_number() OVER (ORDER BY thu_luc::date) AS rn
    FROM thanh_toan WHERE hinh_thuc = 'tien_mat' AND thu_luc::date < current_date AND thu_luc::date >= current_date - 60
    GROUP BY thu_luc::date
) x;

DROP FUNCTION _seed_hoa_don(INT, INT, TIMESTAMP, FLOAT);

-- ---------------------------------------------------------------- thời điểm do trigger ghi bằng now() → đưa về đúng ngày khám
-- (chỉ trong seed: tạm tắt trigger chặn sửa để lịch sử 60 ngày không dồn hết vào hôm nay)
ALTER TABLE giao_dich_kho DISABLE TRIGGER trg_chan_sua_giao_dich_kho;
UPDATE giao_dich_kho g SET thoi_diem = p.kham_luc + INTERVAL '20 minutes', nhan_vien_id = p.bac_si_chinh_id
FROM phieu_dieu_tri p WHERE g.loai = 'xuat_ke_don' AND p.id = g.phieu_id;
ALTER TABLE giao_dich_kho ENABLE TRIGGER trg_chan_sua_giao_dich_kho;

ALTER TABLE lich_su_sua_phieu DISABLE TRIGGER trg_chan_sua_lich_su;
UPDATE lich_su_sua_phieu l SET sua_luc = p.tao_luc + INTERVAL '10 minutes'
FROM phieu_dieu_tri p WHERE p.id = l.phieu_id;
ALTER TABLE lich_su_sua_phieu ENABLE TRIGGER trg_chan_sua_lich_su;
