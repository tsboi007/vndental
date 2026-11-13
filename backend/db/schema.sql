-- =====================================================================
-- PHÒNG KHÁM NHA KHOA NỤ CƯỜI VIỆT — Lược đồ CSDL "PhongKhamRang"
-- Hệ quản trị: PostgreSQL 17 (cần extension btree_gist)
-- Use case: ../.claude/docs/use-case.md · Lựa chọn thiết kế: ./quyet-dinh.md
--
-- Quy ước:
--   - Tên bảng/cột tiếng Việt không dấu, snake_case.
--   - Tiền: NUMERIC(14,0), đơn vị VND.
--   - Không xóa cứng dữ liệu nghiệp vụ (G10, L12): FK mặc định RESTRICT
--     + trigger chặn DELETE trên các bảng hồ sơ.
--   - Ứng dụng đặt nhân viên đang thao tác đầu mỗi giao dịch:
--       SELECT set_config('app.nhan_vien_id', '<id>', true);
--     để trigger lưu vết biết ai sửa phiếu (L13), ai trừ kho.
--   - Mã luật Lx, giả định Gx, use case UCxx: xem use-case.md.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS btree_gist;   -- cho EXCLUDE (khoảng thời gian không chồng nhau)

-- Chặn xóa cứng (dùng chung cho các bảng hồ sơ)
CREATE FUNCTION chan_xoa() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION 'Không được xóa dữ liệu bảng % (phải giữ hồ sơ 5 năm). Hãy đổi trạng thái thay vì xóa.', TG_TABLE_NAME
        USING ERRCODE = 'restrict_violation';
END $$;


-- =====================================================================
-- 1. NHÂN SỰ & CƠ SỞ VẬT CHẤT  (UC18, UC23)
-- =====================================================================

CREATE TABLE nhan_vien (
    id              SERIAL PRIMARY KEY,
    ho_ten          VARCHAR(100) NOT NULL,
    sdt             VARCHAR(15),
    vai_tro         VARCHAR(10)  NOT NULL CHECK (vai_tro IN ('bac_si', 'le_tan', 'quan_ly')),
    ten_dang_nhap   VARCHAR(50)  NOT NULL UNIQUE,                  -- G13: mỗi nhân viên một tài khoản
    mat_khau_hash   VARCHAR(255),                                  -- NULL = chưa đặt mật khẩu
    ban_thoi_gian   BOOLEAN      NOT NULL DEFAULT FALSE,
    dang_lam_viec   BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE TABLE ghe (
    id              SMALLSERIAL PRIMARY KEY,
    ten             VARCHAR(20) NOT NULL UNIQUE,
    dang_hoat_dong  BOOLEAN     NOT NULL DEFAULT TRUE
);

-- Ca trực theo ngày cho bác sĩ và lễ tân (L11, G9, G12)
CREATE TABLE ca_truc (
    id              SERIAL PRIMARY KEY,
    nhan_vien_id    INT         NOT NULL REFERENCES nhan_vien(id),
    ngay            DATE        NOT NULL,
    buoi            VARCHAR(5)  NOT NULL CHECK (buoi IN ('sang', 'chieu')),
    gio_bat_dau     TIME        NOT NULL,
    gio_ket_thuc    TIME        NOT NULL,
    nguoi_xep_id    INT         REFERENCES nhan_vien(id),
    CHECK (gio_ket_thuc > gio_bat_dau),
    CHECK (gio_bat_dau >= TIME '08:00'
           AND gio_ket_thuc <= CASE WHEN extract(isodow FROM ngay) = 7 THEN TIME '17:00' ELSE TIME '20:00' END),
    UNIQUE (nhan_vien_id, ngay, buoi),
    -- Một người không có hai ca chồng giờ
    EXCLUDE USING gist (
        nhan_vien_id WITH =,
        tsrange(ngay + gio_bat_dau, ngay + gio_ket_thuc) WITH &&
    )
);


-- =====================================================================
-- 2. BỆNH NHÂN  (UC05–UC07)
-- =====================================================================

-- SĐT KHÔNG unique: trẻ dưới 15 tuổi dùng số của mẹ, anh chị em chung một số (QĐ2, L1).
CREATE TABLE benh_nhan (
    id                  SERIAL PRIMARY KEY,
    ma_ho_so            VARCHAR(20)  NOT NULL UNIQUE,            -- vd. BN000123
    ma_ho_so_giay       VARCHAR(20)  UNIQUE,                     -- G8: mã hồ sơ giấy cũ (từ 2019)
    ho_ten              VARCHAR(100) NOT NULL,
    ngay_sinh           DATE,
    gioi_tinh           CHAR(1)      CHECK (gioi_tinh IN ('M', 'F')),
    sdt                 VARCHAR(15)  NOT NULL CHECK (sdt ~ '^0[0-9]{9,10}$'),
    sdt_la_cua          VARCHAR(30),                             -- NULL = số của chính bệnh nhân; 'mẹ', 'bố'...
    ten_nguoi_giam_ho   VARCHAR(100),
    dia_chi             VARCHAR(255),
    di_ung              TEXT,                                    -- dị ứng thuốc (bác sĩ cần thấy khi kê đơn)
    tien_su_benh        TEXT,
    nguoi_tao_id        INT          REFERENCES nhan_vien(id),
    tao_luc             TIMESTAMP    NOT NULL DEFAULT now(),
    -- Số không phải của chính mình thì phải biết của ai
    CHECK (sdt_la_cua IS NULL OR ten_nguoi_giam_ho IS NOT NULL)
);

CREATE INDEX ix_benh_nhan_sdt ON benh_nhan (sdt);
-- Chặn tạo trùng cùng một người (cùng số, cùng tên, cùng ngày sinh)
CREATE UNIQUE INDEX ux_benh_nhan_nguoi ON benh_nhan (sdt, lower(ho_ten), ngay_sinh);

CREATE TRIGGER trg_chan_xoa_benh_nhan BEFORE DELETE ON benh_nhan
FOR EACH ROW EXECUTE FUNCTION chan_xoa();


-- =====================================================================
-- 3. DỊCH VỤ & BẢNG GIÁ  (UC19, L5)
-- =====================================================================

CREATE TABLE dich_vu (
    id              SERIAL PRIMARY KEY,
    ma              VARCHAR(20)  NOT NULL UNIQUE,
    ten             VARCHAR(150) NOT NULL,
    nhom            VARCHAR(30),                              -- Tổng quát, Nha chu, Phục hồi, Chỉnh nha, Implant...
    don_vi          VARCHAR(20)  NOT NULL DEFAULT 'lần',      -- lần, răng, hàm, ca
    theo_rang       BOOLEAN      NOT NULL DEFAULT TRUE,       -- FALSE = làm cả hàm (cạo vôi, tẩy trắng) — G4
    dang_ap_dung    BOOLEAN      NOT NULL DEFAULT TRUE
);

-- Giá đổi theo thời gian: thêm dòng mới, không ghi đè. Hai khoảng hiệu lực của cùng dịch vụ không chồng nhau.
CREATE TABLE bang_gia (
    id              SERIAL PRIMARY KEY,
    dich_vu_id      INT           NOT NULL REFERENCES dich_vu(id),
    don_gia         NUMERIC(14,0) NOT NULL CHECK (don_gia >= 0),
    hieu_luc_tu     DATE          NOT NULL,
    hieu_luc_den    DATE,                                     -- NULL = đang áp dụng (khoảng [tu, den) )
    nguoi_cap_nhat  INT           REFERENCES nhan_vien(id),
    cap_nhat_luc    TIMESTAMP     NOT NULL DEFAULT now(),
    CHECK (hieu_luc_den IS NULL OR hieu_luc_den > hieu_luc_tu),
    EXCLUDE USING gist (
        dich_vu_id WITH =,
        daterange(hieu_luc_tu, hieu_luc_den, '[)') WITH &&
    )
);

-- Tra giá của một dịch vụ tại một ngày (chỉ để GỢI Ý khi lập hóa đơn; hóa đơn chốt giá vào dòng)
CREATE FUNCTION gia_tai_ngay(p_dich_vu_id INT, p_ngay DATE)
RETURNS NUMERIC LANGUAGE sql STABLE AS $$
    SELECT don_gia FROM bang_gia
    WHERE dich_vu_id = p_dich_vu_id
      AND daterange(hieu_luc_tu, hieu_luc_den, '[)') @> p_ngay
$$;

-- Đổi giá: đóng khoảng giá đang áp dụng tại ngày đổi rồi mở khoảng mới (UC19)
CREATE FUNCTION doi_gia(p_dich_vu_id INT, p_don_gia NUMERIC, p_tu_ngay DATE)
RETURNS INT LANGUAGE plpgsql AS $$
DECLARE
    v_id INT;
BEGIN
    UPDATE bang_gia SET hieu_luc_den = p_tu_ngay
    WHERE dich_vu_id = p_dich_vu_id AND hieu_luc_den IS NULL AND hieu_luc_tu < p_tu_ngay;

    INSERT INTO bang_gia (dich_vu_id, don_gia, hieu_luc_tu, nguoi_cap_nhat)
    VALUES (p_dich_vu_id, p_don_gia, p_tu_ngay, nullif(current_setting('app.nhan_vien_id', TRUE), '')::INT)
    RETURNING id INTO v_id;
    RETURN v_id;
END $$;


-- =====================================================================
-- 4. THUỐC & VẬT TƯ — chung một kho  (UC21, G5, L14)
-- =====================================================================

CREATE TABLE vat_tu (
    id                  SERIAL PRIMARY KEY,
    ma                  VARCHAR(20)   NOT NULL UNIQUE,
    ten                 VARCHAR(150)  NOT NULL,
    loai                VARCHAR(10)   NOT NULL CHECK (loai IN ('thuoc', 'vat_tu')),
    don_vi              VARCHAR(20)   NOT NULL,             -- viên, hộp, ống, cái
    ton_kho             NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (ton_kho >= 0),
    nguong_dat_them     NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (nguong_dat_them >= 0),
    gia_ban             NUMERIC(14,0) CHECK (gia_ban >= 0), -- giá 1 đơn vị khi kê đơn; NULL = không bán
    dang_su_dung        BOOLEAN       NOT NULL DEFAULT TRUE,
    CHECK (loai = 'thuoc' OR gia_ban IS NULL)
);


-- =====================================================================
-- 5. LIỆU TRÌNH — niềng, implant: nhiều buổi, trả theo đợt  (UC13, L6, G11)
-- =====================================================================

CREATE TABLE lieu_trinh (
    id                      SERIAL PRIMARY KEY,
    benh_nhan_id            INT           NOT NULL REFERENCES benh_nhan(id),
    bac_si_phu_trach_id     INT           NOT NULL REFERENCES nhan_vien(id),
    loai                    VARCHAR(20)   NOT NULL CHECK (loai IN ('nieng_rang', 'implant', 'khac')),
    ten                     VARCHAR(150)  NOT NULL,
    tong_so_buoi            SMALLINT      NOT NULL CHECK (tong_so_buoi > 0),     -- dự kiến
    tong_chi_phi            NUMERIC(14,0) NOT NULL CHECK (tong_chi_phi >= 0),    -- giá trọn gói chốt lúc mở
    ngay_bat_dau            DATE          NOT NULL,
    trang_thai              VARCHAR(12)   NOT NULL DEFAULT 'dang_lam'
                            CHECK (trang_thai IN ('dang_lam', 'hoan_thanh', 'da_dung')),
    ghi_chu                 TEXT
);

-- Các đợt thanh toán đã thỏa thuận
CREATE TABLE lieu_trinh_dot (
    id              SERIAL PRIMARY KEY,
    lieu_trinh_id   INT           NOT NULL REFERENCES lieu_trinh(id),
    dot_so          SMALLINT      NOT NULL CHECK (dot_so > 0),
    so_tien         NUMERIC(14,0) NOT NULL CHECK (so_tien > 0),
    mo_ta           VARCHAR(150),                         -- 'Đặt cọc', 'Gắn mắc cài'...
    han_thanh_toan  DATE,
    UNIQUE (lieu_trinh_id, dot_so)
);

-- Tổng các đợt không vượt giá trọn gói
CREATE FUNCTION kiem_tra_tong_dot() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    v_tong NUMERIC;
    v_tron_goi NUMERIC;
BEGIN
    SELECT coalesce(sum(so_tien), 0) INTO v_tong FROM lieu_trinh_dot WHERE lieu_trinh_id = NEW.lieu_trinh_id;
    SELECT tong_chi_phi INTO v_tron_goi FROM lieu_trinh WHERE id = NEW.lieu_trinh_id;
    IF v_tong > v_tron_goi THEN
        RAISE EXCEPTION 'Tổng các đợt (%) vượt chi phí trọn gói của liệu trình (%)', v_tong, v_tron_goi;
    END IF;
    RETURN NEW;
END $$;

CREATE TRIGGER trg_kiem_tra_tong_dot AFTER INSERT OR UPDATE ON lieu_trinh_dot
FOR EACH ROW EXECUTE FUNCTION kiem_tra_tong_dot();


-- =====================================================================
-- 6. LỊCH HẸN  (UC01–UC05, L2, L3, L10, L11)
-- =====================================================================

-- Danh mục lý do hủy (UC23) — thống kê được "hay bị hủy vì lý do gì"
CREATE TABLE ly_do_huy (
    ma              VARCHAR(20)  PRIMARY KEY,
    ten             VARCHAR(100) NOT NULL,
    dang_dung       BOOLEAN      NOT NULL DEFAULT TRUE
);

CREATE TABLE lich_hen (
    id                  SERIAL PRIMARY KEY,
    benh_nhan_id        INT          NOT NULL REFERENCES benh_nhan(id),
    bac_si_id           INT          NOT NULL REFERENCES nhan_vien(id),
    ghe_id              SMALLINT     NOT NULL REFERENCES ghe(id),
    ngay                DATE         NOT NULL,
    gio_bat_dau         TIME         NOT NULL,              -- khung 30': kết thúc = bắt đầu + 30' (G3)
    dich_vu_id          INT          REFERENCES dich_vu(id),  -- việc cần làm (nếu xác định được)
    noi_dung            VARCHAR(255),                       -- lễ tân ghi tự do
    lieu_trinh_id       INT          REFERENCES lieu_trinh(id),
    buoi_thu            SMALLINT     CHECK (buoi_thu > 0),
    trang_thai          VARCHAR(12)  NOT NULL DEFAULT 'da_dat'
                        CHECK (trang_thai IN ('da_dat', 'da_nhac', 'da_den', 'hoan_thanh', 'khong_den', 'da_huy')),
    doi_tu_lich_hen_id  INT          REFERENCES lich_hen(id), -- UC04: lịch mới được dời từ lịch nào
    nguoi_dat_id        INT          NOT NULL REFERENCES nhan_vien(id),
    dat_luc             TIMESTAMP    NOT NULL DEFAULT now(),
    den_luc             TIMESTAMP,                          -- lúc tiếp nhận (UC05)

    -- Hủy lịch: lý do, ai hủy, lúc nào (L10)
    ly_do_huy_ma        VARCHAR(20)  REFERENCES ly_do_huy(ma),
    ghi_chu_huy         VARCHAR(255),
    ben_huy             VARCHAR(12)  CHECK (ben_huy IN ('benh_nhan', 'phong_kham')),
    nguoi_ghi_huy_id    INT          REFERENCES nhan_vien(id),
    huy_luc             TIMESTAMP,

    -- Khung bắt đầu ở :00 / :30, trong giờ mở cửa (G2)
    CHECK (extract(minute FROM gio_bat_dau) IN (0, 30) AND extract(second FROM gio_bat_dau) = 0),
    CHECK (gio_bat_dau >= TIME '08:00'
           AND gio_bat_dau <= CASE WHEN extract(isodow FROM ngay) = 7 THEN TIME '16:30' ELSE TIME '19:30' END),
    -- Đã hủy thì phải đủ thông tin hủy; chưa hủy thì không có
    CHECK ((trang_thai = 'da_huy') =
           (ly_do_huy_ma IS NOT NULL AND ben_huy IS NOT NULL AND nguoi_ghi_huy_id IS NOT NULL AND huy_luc IS NOT NULL)),
    CHECK ((lieu_trinh_id IS NULL) = (buoi_thu IS NULL)),
    CHECK (doi_tu_lich_hen_id IS NULL OR doi_tu_lich_hen_id <> id)
);

-- L3: cùng ghế / cùng bác sĩ không có hai lịch trùng khung (lịch đã hủy không tính → khung được giải phóng)
CREATE UNIQUE INDEX ux_lich_hen_ghe    ON lich_hen (ghe_id,    ngay, gio_bat_dau) WHERE trang_thai <> 'da_huy';
CREATE UNIQUE INDEX ux_lich_hen_bac_si ON lich_hen (bac_si_id, ngay, gio_bat_dau) WHERE trang_thai <> 'da_huy';
CREATE INDEX ix_lich_hen_benh_nhan ON lich_hen (benh_nhan_id);
CREATE INDEX ix_lich_hen_ngay      ON lich_hen (ngay);

-- L11: bác sĩ phải là bác sĩ đang làm, ghế đang hoạt động, khung nằm trọn trong ca trực của bác sĩ
CREATE FUNCTION kiem_tra_lich_hen() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.trang_thai = 'da_huy' THEN
        RETURN NEW;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM nhan_vien WHERE id = NEW.bac_si_id AND vai_tro = 'bac_si' AND dang_lam_viec) THEN
        RAISE EXCEPTION 'Nhân viên % không phải bác sĩ đang làm việc', NEW.bac_si_id;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM ghe WHERE id = NEW.ghe_id AND dang_hoat_dong) THEN
        RAISE EXCEPTION 'Ghế % đang ngừng hoạt động', NEW.ghe_id;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM ca_truc
        WHERE nhan_vien_id = NEW.bac_si_id
          AND ngay = NEW.ngay
          AND gio_bat_dau <= NEW.gio_bat_dau
          AND gio_ket_thuc >= NEW.gio_bat_dau + INTERVAL '30 minutes'
    ) THEN
        RAISE EXCEPTION 'Bác sĩ % không có ca trực lúc % %', NEW.bac_si_id, NEW.ngay, NEW.gio_bat_dau;
    END IF;

    RETURN NEW;
END $$;

CREATE TRIGGER trg_kiem_tra_lich_hen
BEFORE INSERT OR UPDATE OF bac_si_id, ghe_id, ngay, gio_bat_dau, trang_thai ON lich_hen
FOR EACH ROW EXECUTE FUNCTION kiem_tra_lich_hen();

CREATE TRIGGER trg_chan_xoa_lich_hen BEFORE DELETE ON lich_hen
FOR EACH ROW EXECUTE FUNCTION chan_xoa();

-- UC18: không được bỏ / thu hẹp ca trực khi trong ca đã có lịch hẹn của bác sĩ đó
CREATE FUNCTION kiem_tra_sua_ca_truc() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM lich_hen lh
        WHERE lh.bac_si_id = OLD.nhan_vien_id
          AND lh.ngay = OLD.ngay
          AND lh.trang_thai <> 'da_huy'
          AND lh.gio_bat_dau >= OLD.gio_bat_dau
          AND lh.gio_bat_dau + INTERVAL '30 minutes' <= OLD.gio_ket_thuc
          AND (TG_OP = 'DELETE'
               OR NOT (NEW.nhan_vien_id = OLD.nhan_vien_id AND NEW.ngay = OLD.ngay
                       AND NEW.gio_bat_dau <= lh.gio_bat_dau
                       AND NEW.gio_ket_thuc >= lh.gio_bat_dau + INTERVAL '30 minutes'))
    ) THEN
        RAISE EXCEPTION 'Ca trực ngày % đã có lịch hẹn; hãy dời hoặc hủy lịch trước', OLD.ngay;
    END IF;
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END $$;

CREATE TRIGGER trg_kiem_tra_sua_ca_truc
BEFORE UPDATE OR DELETE ON ca_truc
FOR EACH ROW EXECUTE FUNCTION kiem_tra_sua_ca_truc();

-- UC03: mỗi lần nhắc — gọi điện trước, không nghe máy thì nhắn tin (Dịch vụ SMS)
CREATE TABLE nhac_lich (
    id              SERIAL PRIMARY KEY,
    lich_hen_id     INT          NOT NULL REFERENCES lich_hen(id),
    kenh            VARCHAR(10)  NOT NULL CHECK (kenh IN ('goi_dien', 'tin_nhan')),
    ket_qua         VARCHAR(12)  NOT NULL CHECK (ket_qua IN ('nghe_may', 'khong_nghe', 'da_gui', 'gui_loi')),
    nhan_vien_id    INT          REFERENCES nhan_vien(id),   -- NULL nếu tin nhắn gửi tự động
    ma_tin_nhan     VARCHAR(50),                             -- mã nhà cung cấp SMS trả về (G14)
    ghi_chu         VARCHAR(255),
    thoi_diem       TIMESTAMP    NOT NULL DEFAULT now(),
    CHECK ((kenh = 'goi_dien' AND ket_qua IN ('nghe_may', 'khong_nghe') AND nhan_vien_id IS NOT NULL)
        OR (kenh = 'tin_nhan' AND ket_qua IN ('da_gui', 'gui_loi')))
);

CREATE INDEX ix_nhac_lich_lich_hen ON nhac_lich (lich_hen_id);


-- =====================================================================
-- 7. PHIẾU ĐIỀU TRỊ  (UC08–UC14, L4, L7, L13)
-- =====================================================================

CREATE TABLE phieu_dieu_tri (
    id                  SERIAL PRIMARY KEY,
    benh_nhan_id        INT          NOT NULL REFERENCES benh_nhan(id),
    lich_hen_id         INT          UNIQUE REFERENCES lich_hen(id),   -- NULL nếu khách vãng lai
    bac_si_chinh_id     INT          NOT NULL REFERENCES nhan_vien(id),
    ghe_id              SMALLINT     NOT NULL REFERENCES ghe(id),
    kham_luc            TIMESTAMP    NOT NULL,                         -- ngày + giờ khám
    chan_doan           TEXT,
    ghi_chu             TEXT,
    trang_thai          VARCHAR(10)  NOT NULL DEFAULT 'dang_kham'
                        CHECK (trang_thai IN ('dang_kham', 'hoan_tat')),
    hoan_tat_luc        TIMESTAMP,
    tao_luc             TIMESTAMP    NOT NULL DEFAULT now(),
    CHECK ((trang_thai = 'hoan_tat') = (hoan_tat_luc IS NOT NULL))
);

CREATE INDEX ix_phieu_benh_nhan ON phieu_dieu_tri (benh_nhan_id, kham_luc);

CREATE TRIGGER trg_chan_xoa_phieu BEFORE DELETE ON phieu_dieu_tri
FOR EACH ROW EXECUTE FUNCTION chan_xoa();

-- Mỗi việc đã làm một dòng, kèm số răng và bác sĩ thực hiện (L4, QĐ1)
CREATE TABLE chi_tiet_dieu_tri (
    id                      SERIAL PRIMARY KEY,
    phieu_id                INT           NOT NULL REFERENCES phieu_dieu_tri(id),
    dich_vu_id              INT           NOT NULL REFERENCES dich_vu(id),
    rang_so                 SMALLINT,     -- FDI (G4); NULL = làm cả hàm / cả miệng
    bac_si_thuc_hien_id     INT           NOT NULL REFERENCES nhan_vien(id),
    so_luong                NUMERIC(6,2)  NOT NULL DEFAULT 1 CHECK (so_luong > 0),
    lieu_trinh_id           INT           REFERENCES lieu_trinh(id),
    buoi_thu                SMALLINT      CHECK (buoi_thu > 0),
    ghi_chu                 VARCHAR(255),
    CHECK (rang_so IS NULL
        OR (rang_so / 10 BETWEEN 1 AND 4 AND rang_so % 10 BETWEEN 1 AND 8)    -- răng vĩnh viễn 11–48
        OR (rang_so / 10 BETWEEN 5 AND 8 AND rang_so % 10 BETWEEN 1 AND 5)),  -- răng sữa 51–85
    CHECK ((lieu_trinh_id IS NULL) = (buoi_thu IS NULL))
);

CREATE INDEX ix_ctdt_phieu      ON chi_tiet_dieu_tri (phieu_id);
CREATE INDEX ix_ctdt_lieu_trinh ON chi_tiet_dieu_tri (lieu_trinh_id) WHERE lieu_trinh_id IS NOT NULL;

-- Dòng việc: dịch vụ theo răng thì phải có số răng; người thực hiện phải là bác sĩ;
-- liệu trình phải của đúng bệnh nhân trên phiếu
CREATE FUNCTION kiem_tra_chi_tiet_dieu_tri() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF NEW.rang_so IS NULL AND (SELECT theo_rang FROM dich_vu WHERE id = NEW.dich_vu_id) THEN
        RAISE EXCEPTION 'Dịch vụ % phải ghi số răng', NEW.dich_vu_id;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM nhan_vien WHERE id = NEW.bac_si_thuc_hien_id AND vai_tro = 'bac_si') THEN
        RAISE EXCEPTION 'Người thực hiện % không phải bác sĩ', NEW.bac_si_thuc_hien_id;
    END IF;
    IF NEW.lieu_trinh_id IS NOT NULL AND NOT EXISTS (
        SELECT 1 FROM lieu_trinh lt JOIN phieu_dieu_tri p ON p.benh_nhan_id = lt.benh_nhan_id
        WHERE lt.id = NEW.lieu_trinh_id AND p.id = NEW.phieu_id
    ) THEN
        RAISE EXCEPTION 'Liệu trình % không thuộc bệnh nhân của phiếu %', NEW.lieu_trinh_id, NEW.phieu_id;
    END IF;
    RETURN NEW;
END $$;

CREATE TRIGGER trg_kiem_tra_chi_tiet_dieu_tri
BEFORE INSERT OR UPDATE ON chi_tiet_dieu_tri
FOR EACH ROW EXECUTE FUNCTION kiem_tra_chi_tiet_dieu_tri();

-- Thuốc kê theo từng lần khám (L7)
CREATE TABLE don_thuoc (
    id              SERIAL PRIMARY KEY,
    phieu_id        INT           NOT NULL REFERENCES phieu_dieu_tri(id),
    vat_tu_id       INT           NOT NULL REFERENCES vat_tu(id),    -- vat_tu.loai = 'thuoc'
    lieu_dung       VARCHAR(255)  NOT NULL,                          -- 'Ngày 2 lần, mỗi lần 1 viên sau ăn'
    so_luong        NUMERIC(8,2)  NOT NULL CHECK (so_luong > 0)
);

CREATE INDEX ix_don_thuoc_phieu ON don_thuoc (phieu_id);


-- =====================================================================
-- 8. KHO — mọi biến động tồn kho đi qua bảng giao dịch  (UC11, UC12, UC21, L14)
-- =====================================================================

CREATE TABLE giao_dich_kho (
    id                      SERIAL PRIMARY KEY,
    vat_tu_id               INT           NOT NULL REFERENCES vat_tu(id),
    loai                    VARCHAR(12)   NOT NULL CHECK (loai IN ('nhap', 'xuat_dung', 'xuat_ke_don', 'dieu_chinh')),
    so_luong                NUMERIC(12,2) NOT NULL CHECK (so_luong <> 0),   -- dương = nhập, âm = xuất
    phieu_id                INT           REFERENCES phieu_dieu_tri(id),    -- UC12: vật tư dùng ở lần khám nào
    chi_tiet_dieu_tri_id    INT           REFERENCES chi_tiet_dieu_tri(id), -- (tùy chọn) dùng cho việc nào
    don_thuoc_id            INT           REFERENCES don_thuoc(id),
    nhan_vien_id            INT           REFERENCES nhan_vien(id),
    thoi_diem               TIMESTAMP     NOT NULL DEFAULT now(),
    ghi_chu                 VARCHAR(255),
    CHECK ((loai = 'nhap' AND so_luong > 0)
        OR (loai IN ('xuat_dung', 'xuat_ke_don') AND so_luong < 0)
        OR (loai = 'dieu_chinh' AND ghi_chu IS NOT NULL)),
    CHECK (loai <> 'xuat_ke_don' OR don_thuoc_id IS NOT NULL),
    CHECK (loai <> 'xuat_dung'   OR phieu_id IS NOT NULL)
);

CREATE INDEX ix_gdk_vat_tu ON giao_dich_kho (vat_tu_id, thoi_diem);

-- Cập nhật tồn kho; CHECK (ton_kho >= 0) chặn xuất quá tồn
CREATE FUNCTION cap_nhat_ton_kho() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    UPDATE vat_tu SET ton_kho = ton_kho + NEW.so_luong WHERE id = NEW.vat_tu_id;
    RETURN NEW;
END $$;

CREATE TRIGGER trg_cap_nhat_ton_kho
AFTER INSERT ON giao_dich_kho
FOR EACH ROW EXECUTE FUNCTION cap_nhat_ton_kho();

-- Giao dịch kho không sửa / xóa: sai thì ghi giao dịch điều chỉnh
CREATE FUNCTION chan_sua_giao_dich_kho() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    RAISE EXCEPTION 'Không sửa/xóa giao dịch kho; hãy ghi một giao dịch điều chỉnh';
END $$;

CREATE TRIGGER trg_chan_sua_giao_dich_kho
BEFORE UPDATE OR DELETE ON giao_dich_kho
FOR EACH ROW EXECUTE FUNCTION chan_sua_giao_dich_kho();

-- Kê đơn: chỉ kê thuốc, rồi tự trừ kho
CREATE FUNCTION kiem_tra_don_thuoc() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM vat_tu WHERE id = NEW.vat_tu_id AND loai = 'thuoc' AND dang_su_dung) THEN
        RAISE EXCEPTION 'Mã % không phải thuốc đang dùng, không kê đơn được', NEW.vat_tu_id;
    END IF;
    RETURN NEW;
END $$;

CREATE TRIGGER trg_kiem_tra_don_thuoc
BEFORE INSERT OR UPDATE OF vat_tu_id ON don_thuoc
FOR EACH ROW EXECUTE FUNCTION kiem_tra_don_thuoc();

CREATE FUNCTION tru_kho_khi_ke_don() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
    INSERT INTO giao_dich_kho (vat_tu_id, loai, so_luong, phieu_id, don_thuoc_id, nhan_vien_id)
    VALUES (NEW.vat_tu_id, 'xuat_ke_don', -NEW.so_luong, NEW.phieu_id, NEW.id,
            nullif(current_setting('app.nhan_vien_id', TRUE), '')::INT);
    RETURN NEW;
END $$;

CREATE TRIGGER trg_tru_kho_khi_ke_don
AFTER INSERT ON don_thuoc
FOR EACH ROW EXECUTE FUNCTION tru_kho_khi_ke_don();


-- =====================================================================
-- 9. LƯU VẾT SỬA PHIẾU ĐIỀU TRỊ — ai sửa, lúc nào, cũ → mới  (UC14, L13)
-- =====================================================================

CREATE TABLE lich_su_sua_phieu (
    id              BIGSERIAL PRIMARY KEY,
    phieu_id        INT         NOT NULL REFERENCES phieu_dieu_tri(id),
    bang            VARCHAR(30) NOT NULL,          -- phieu_dieu_tri / chi_tiet_dieu_tri / don_thuoc
    ban_ghi_id      INT         NOT NULL,
    thao_tac        VARCHAR(6)  NOT NULL CHECK (thao_tac IN ('INSERT', 'UPDATE', 'DELETE')),
    du_lieu_cu      JSONB,
    du_lieu_moi     JSONB,
    nhan_vien_id    INT         REFERENCES nhan_vien(id),
    sua_luc         TIMESTAMP   NOT NULL DEFAULT now()
);

CREATE INDEX ix_lssp_phieu ON lich_su_sua_phieu (phieu_id, sua_luc);

CREATE FUNCTION ghi_lich_su_phieu() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    v_ban_ghi  RECORD;
    v_phieu_id INT;
BEGIN
    IF TG_OP = 'DELETE' THEN v_ban_ghi := OLD; ELSE v_ban_ghi := NEW; END IF;

    IF TG_TABLE_NAME = 'phieu_dieu_tri' THEN
        v_phieu_id := v_ban_ghi.id;
    ELSE
        v_phieu_id := v_ban_ghi.phieu_id;
    END IF;

    INSERT INTO lich_su_sua_phieu (phieu_id, bang, ban_ghi_id, thao_tac, du_lieu_cu, du_lieu_moi, nhan_vien_id)
    VALUES (
        v_phieu_id, TG_TABLE_NAME, v_ban_ghi.id, TG_OP,
        CASE WHEN TG_OP <> 'INSERT' THEN to_jsonb(OLD) END,
        CASE WHEN TG_OP <> 'DELETE' THEN to_jsonb(NEW) END,
        nullif(current_setting('app.nhan_vien_id', TRUE), '')::INT
    );
    RETURN v_ban_ghi;
END $$;

-- Phiếu: lưu khi sửa (không lưu lúc tạo). Dòng việc / đơn thuốc: lưu cả thêm, sửa, xóa.
CREATE TRIGGER trg_ls_phieu      AFTER UPDATE                     ON phieu_dieu_tri    FOR EACH ROW EXECUTE FUNCTION ghi_lich_su_phieu();
CREATE TRIGGER trg_ls_chi_tiet   AFTER INSERT OR UPDATE OR DELETE ON chi_tiet_dieu_tri FOR EACH ROW EXECUTE FUNCTION ghi_lich_su_phieu();
CREATE TRIGGER trg_ls_don_thuoc  AFTER INSERT OR UPDATE OR DELETE ON don_thuoc         FOR EACH ROW EXECUTE FUNCTION ghi_lich_su_phieu();

-- Lịch sử sửa là bằng chứng: không sửa, không xóa
CREATE TRIGGER trg_chan_sua_lich_su BEFORE UPDATE OR DELETE ON lich_su_sua_phieu
FOR EACH ROW EXECUTE FUNCTION chan_xoa();


-- =====================================================================
-- 10. HÓA ĐƠN & THANH TOÁN  (UC15–UC17, L5, L8, L9)
-- =====================================================================

CREATE TABLE hoa_don (
    id                  SERIAL PRIMARY KEY,
    ma_hoa_don          VARCHAR(20) NOT NULL UNIQUE,             -- vd. HD2611-0001
    benh_nhan_id        INT         NOT NULL REFERENCES benh_nhan(id),
    phieu_dieu_tri_id   INT         REFERENCES phieu_dieu_tri(id),
    nguoi_lap_id        INT         NOT NULL REFERENCES nhan_vien(id),
    lap_luc             TIMESTAMP   NOT NULL DEFAULT now(),
    ghi_chu             TEXT
);

CREATE INDEX ix_hoa_don_benh_nhan ON hoa_don (benh_nhan_id);
CREATE INDEX ix_hoa_don_lap_luc   ON hoa_don (lap_luc);

CREATE TRIGGER trg_chan_xoa_hoa_don BEFORE DELETE ON hoa_don
FOR EACH ROW EXECUTE FUNCTION chan_xoa();

-- Giá chốt vào dòng lúc lập (không tham chiếu bảng giá) → đổi bảng giá không ảnh hưởng hóa đơn cũ (L5).
-- Giảm giá luôn ghi ở từng dòng (QĐ3).
CREATE TABLE chi_tiet_hoa_don (
    id                      SERIAL PRIMARY KEY,
    hoa_don_id              INT           NOT NULL REFERENCES hoa_don(id),
    chi_tiet_dieu_tri_id    INT           UNIQUE REFERENCES chi_tiet_dieu_tri(id),
    don_thuoc_id            INT           UNIQUE REFERENCES don_thuoc(id),
    lieu_trinh_dot_id       INT           UNIQUE REFERENCES lieu_trinh_dot(id),
    mo_ta                   VARCHAR(255)  NOT NULL,
    so_luong                NUMERIC(8,2)  NOT NULL DEFAULT 1 CHECK (so_luong > 0),
    don_gia                 NUMERIC(14,0) NOT NULL CHECK (don_gia >= 0),
    giam_gia                NUMERIC(14,0) NOT NULL DEFAULT 0 CHECK (giam_gia >= 0),
    thanh_tien              NUMERIC(14,0) GENERATED ALWAYS AS (round(so_luong * don_gia) - giam_gia) STORED,
    bac_si_id               INT           REFERENCES nhan_vien(id),   -- bác sĩ được tính doanh thu dòng này
    CHECK (giam_gia <= round(so_luong * don_gia)),
    CHECK (num_nonnulls(chi_tiet_dieu_tri_id, don_thuoc_id, lieu_trinh_dot_id) <= 1)
);

CREATE INDEX ix_cthd_hoa_don ON chi_tiet_hoa_don (hoa_don_id);

-- Đã thu tiền thì không sửa / xóa dòng hóa đơn nữa (tránh lệch công nợ, đối soát)
CREATE FUNCTION kiem_tra_sua_dong_hoa_don() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    v_hd INT;
BEGIN
    IF TG_OP = 'INSERT' THEN v_hd := NEW.hoa_don_id; ELSE v_hd := OLD.hoa_don_id; END IF;
    IF TG_OP <> 'INSERT' AND EXISTS (SELECT 1 FROM thanh_toan WHERE hoa_don_id = v_hd) THEN
        RAISE EXCEPTION 'Hóa đơn % đã thu tiền, không sửa/xóa dòng được', v_hd;
    END IF;
    RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END $$;

CREATE TRIGGER trg_kiem_tra_sua_dong_hoa_don
BEFORE UPDATE OR DELETE ON chi_tiet_hoa_don
FOR EACH ROW EXECUTE FUNCTION kiem_tra_sua_dong_hoa_don();

-- QĐ3: giảm giá ở tổng → chia về các dòng theo tỷ lệ thành tiền; phần lẻ dồn vào dòng lớn nhất.
-- Chỉ gọi khi hóa đơn chưa thu tiền. Trả về số tiền đã giảm.
CREATE FUNCTION chia_giam_gia_tong(p_hoa_don_id INT, p_so_tien NUMERIC)
RETURNS NUMERIC LANGUAGE plpgsql AS $$
DECLARE
    v_goc   NUMERIC;   -- tổng trước giảm (thêm phần đã giảm trước đó)
    v_con   NUMERIC := p_so_tien;
    r       RECORD;
    v_phan  NUMERIC;
BEGIN
    SELECT sum(thanh_tien) INTO v_goc FROM chi_tiet_hoa_don WHERE hoa_don_id = p_hoa_don_id;
    IF v_goc IS NULL OR p_so_tien <= 0 OR p_so_tien > v_goc THEN
        RAISE EXCEPTION 'Số giảm % không hợp lệ (tổng còn lại của hóa đơn là %)', p_so_tien, coalesce(v_goc, 0);
    END IF;

    FOR r IN SELECT id, thanh_tien FROM chi_tiet_hoa_don
             WHERE hoa_don_id = p_hoa_don_id AND thanh_tien > 0
             ORDER BY thanh_tien, id            -- dòng lớn nhất đi sau cùng, nhận phần lẻ
    LOOP
        v_phan := least(r.thanh_tien, floor(p_so_tien * r.thanh_tien / v_goc));
        UPDATE chi_tiet_hoa_don SET giam_gia = giam_gia + v_phan WHERE id = r.id;
        v_con := v_con - v_phan;
    END LOOP;

    -- Phần lẻ còn lại: dồn vào các dòng từ lớn tới nhỏ (đến khi hết)
    FOR r IN SELECT id, thanh_tien FROM chi_tiet_hoa_don
             WHERE hoa_don_id = p_hoa_don_id AND thanh_tien > 0
             ORDER BY thanh_tien DESC, id
    LOOP
        EXIT WHEN v_con <= 0;
        v_phan := least(v_con, r.thanh_tien);
        UPDATE chi_tiet_hoa_don SET giam_gia = giam_gia + v_phan WHERE id = r.id;
        v_con := v_con - v_phan;
    END LOOP;

    RETURN p_so_tien;
END $$;

-- Một hóa đơn thu nhiều lần, mỗi lần ghi hình thức (L8)
CREATE TABLE thanh_toan (
    id              SERIAL PRIMARY KEY,
    hoa_don_id      INT           NOT NULL REFERENCES hoa_don(id),
    so_tien         NUMERIC(14,0) NOT NULL CHECK (so_tien > 0),
    hinh_thuc       VARCHAR(12)   NOT NULL CHECK (hinh_thuc IN ('tien_mat', 'chuyen_khoan')),
    ma_giao_dich    VARCHAR(50),                         -- mã chuyển khoản, nếu có
    nguoi_thu_id    INT           NOT NULL REFERENCES nhan_vien(id),
    thu_luc         TIMESTAMP     NOT NULL DEFAULT now(),
    ghi_chu         VARCHAR(255)
);

CREATE INDEX ix_thanh_toan_hoa_don ON thanh_toan (hoa_don_id);
CREATE INDEX ix_thanh_toan_ngay    ON thanh_toan (thu_luc);

-- L9: không thu quá số còn nợ
CREATE FUNCTION kiem_tra_thu_qua() RETURNS trigger LANGUAGE plpgsql AS $$
DECLARE
    v_tong   NUMERIC;
    v_da_thu NUMERIC;
BEGIN
    SELECT coalesce(sum(thanh_tien), 0) INTO v_tong   FROM chi_tiet_hoa_don WHERE hoa_don_id = NEW.hoa_don_id;
    SELECT coalesce(sum(so_tien), 0)    INTO v_da_thu FROM thanh_toan       WHERE hoa_don_id = NEW.hoa_don_id;
    IF v_da_thu > v_tong THEN
        RAISE EXCEPTION 'Hóa đơn % chỉ còn nợ %, không thu được %',
            NEW.hoa_don_id, v_tong - (v_da_thu - NEW.so_tien), NEW.so_tien;
    END IF;
    RETURN NEW;
END $$;

CREATE TRIGGER trg_kiem_tra_thu_qua
AFTER INSERT OR UPDATE ON thanh_toan
FOR EACH ROW EXECUTE FUNCTION kiem_tra_thu_qua();

-- Tiền đã thu không sửa / xóa (thu nhầm thì xử lý bằng nghiệp vụ hoàn tiền ngoài phạm vi)
CREATE TRIGGER trg_chan_xoa_thanh_toan BEFORE DELETE ON thanh_toan
FOR EACH ROW EXECUTE FUNCTION chan_xoa();

-- UC17: cuối ngày đếm tiền trong két, so với tổng thu tiền mặt
CREATE TABLE doi_soat_cuoi_ngay (
    id                  SERIAL PRIMARY KEY,
    ngay                DATE          NOT NULL UNIQUE,
    tien_mat_he_thong   NUMERIC(14,0) NOT NULL,          -- tổng thanh_toan tiền mặt trong ngày
    tien_mat_dem_duoc   NUMERIC(14,0) NOT NULL CHECK (tien_mat_dem_duoc >= 0),
    chenh_lech          NUMERIC(14,0) GENERATED ALWAYS AS (tien_mat_dem_duoc - tien_mat_he_thong) STORED,
    nguoi_doi_soat_id   INT           NOT NULL REFERENCES nhan_vien(id),
    doi_soat_luc        TIMESTAMP     NOT NULL DEFAULT now(),
    ghi_chu             VARCHAR(255),
    CHECK (tien_mat_dem_duoc = tien_mat_he_thong OR ghi_chu IS NOT NULL)   -- lệch thì phải giải thích
);


-- =====================================================================
-- 11. VIEW
-- =====================================================================

-- L9: tổng tiền, đã thu, còn nợ, trạng thái của từng hóa đơn
CREATE VIEW v_cong_no_hoa_don AS
SELECT hd.id AS hoa_don_id,
       hd.ma_hoa_don,
       hd.benh_nhan_id,
       hd.lap_luc,
       coalesce(ct.tong_tien, 0)                          AS tong_tien,
       coalesce(tt.da_thu, 0)                             AS da_thu,
       coalesce(ct.tong_tien, 0) - coalesce(tt.da_thu, 0) AS con_no,
       CASE WHEN coalesce(tt.da_thu, 0) = 0 AND coalesce(ct.tong_tien, 0) > 0 THEN 'chua_thu'
            WHEN coalesce(ct.tong_tien, 0) - coalesce(tt.da_thu, 0) > 0     THEN 'con_no'
            ELSE 'da_thanh_toan' END                       AS trang_thai
FROM hoa_don hd
LEFT JOIN (SELECT hoa_don_id, sum(thanh_tien) AS tong_tien FROM chi_tiet_hoa_don GROUP BY hoa_don_id) ct
       ON ct.hoa_don_id = hd.id
LEFT JOIN (SELECT hoa_don_id, sum(so_tien) AS da_thu FROM thanh_toan GROUP BY hoa_don_id) tt
       ON tt.hoa_don_id = hd.id;

-- Liệu trình đang dở: đã làm mấy buổi, còn mấy buổi, đã thu bao nhiêu
CREATE VIEW v_lieu_trinh_dang_do AS
SELECT lt.id AS lieu_trinh_id,
       lt.benh_nhan_id,
       bn.ho_ten,
       bn.sdt,
       lt.ten,
       lt.bac_si_phu_trach_id,
       lt.tong_so_buoi,
       count(DISTINCT ct.phieu_id)                                     AS so_buoi_da_lam,
       greatest(lt.tong_so_buoi - count(DISTINCT ct.phieu_id), 0)      AS so_buoi_con_lai,
       lt.tong_chi_phi,
       (SELECT coalesce(sum(cthd.thanh_tien), 0)
          FROM lieu_trinh_dot d JOIN chi_tiet_hoa_don cthd ON cthd.lieu_trinh_dot_id = d.id
         WHERE d.lieu_trinh_id = lt.id)                                AS da_lap_hoa_don
FROM lieu_trinh lt
JOIN benh_nhan bn ON bn.id = lt.benh_nhan_id
LEFT JOIN chi_tiet_dieu_tri ct ON ct.lieu_trinh_id = lt.id
WHERE lt.trang_thai = 'dang_lam'
GROUP BY lt.id, bn.id;

-- L14: thuốc / vật tư chạm ngưỡng đặt thêm
CREATE VIEW v_vat_tu_sap_het AS
SELECT id, ma, ten, loai, don_vi, ton_kho, nguong_dat_them
FROM vat_tu
WHERE dang_su_dung AND ton_kho <= nguong_dat_them;

-- UC01: khung còn trống (ngày × ghế × khung 30') trong khoảng ngày; kèm bác sĩ đang trực khung đó
CREATE FUNCTION khung_trong(p_tu DATE, p_den DATE)
RETURNS TABLE (ngay DATE, gio_bat_dau TIME, ghe_id SMALLINT, bac_si_truc INT[])
LANGUAGE sql STABLE AS $$
    WITH khung AS (
        SELECT d::date AS ngay, (TIME '08:00' + make_interval(mins => 30 * k)) AS gio
        FROM generate_series(p_tu, p_den, INTERVAL '1 day') d
        CROSS JOIN generate_series(0, 23) k
        WHERE TIME '08:00' + make_interval(mins => 30 * k)
              <= CASE WHEN extract(isodow FROM d) = 7 THEN TIME '16:30' ELSE TIME '19:30' END
    )
    SELECT k.ngay, k.gio, g.id,
           array(SELECT ct.nhan_vien_id FROM ca_truc ct JOIN nhan_vien nv ON nv.id = ct.nhan_vien_id
                 WHERE nv.vai_tro = 'bac_si' AND ct.ngay = k.ngay
                   AND ct.gio_bat_dau <= k.gio AND ct.gio_ket_thuc >= k.gio + INTERVAL '30 minutes'
                   AND NOT EXISTS (SELECT 1 FROM lich_hen l WHERE l.bac_si_id = ct.nhan_vien_id
                                   AND l.ngay = k.ngay AND l.gio_bat_dau = k.gio AND l.trang_thai <> 'da_huy')
                 ORDER BY 1)
    FROM khung k
    CROSS JOIN ghe g
    WHERE g.dang_hoat_dong
      AND NOT EXISTS (SELECT 1 FROM lich_hen l WHERE l.ghe_id = g.id AND l.ngay = k.ngay
                      AND l.gio_bat_dau = k.gio AND l.trang_thai <> 'da_huy')
    ORDER BY 1, 2, 3
$$;


-- =====================================================================
-- 12. DANH MỤC CỐ ĐỊNH
-- =====================================================================

INSERT INTO ghe (ten) VALUES ('Ghế 1'), ('Ghế 2'), ('Ghế 3');

INSERT INTO ly_do_huy (ma, ten) VALUES
    ('ban_viec',      'Bệnh nhân bận việc'),
    ('om',            'Bệnh nhân ốm'),
    ('quen_lich',     'Quên lịch / không liên lạc được'),
    ('doi_y',         'Đổi ý, không làm nữa'),
    ('chi_phi',       'Lo ngại chi phí'),
    ('doi_lich',      'Dời sang lịch khác'),
    ('bac_si_vang',   'Bác sĩ vắng'),
    ('thiet_bi',      'Ghế / thiết bị hỏng'),
    ('khac',          'Lý do khác');
