# Kiểm thử đầu-cuối các luồng chính trên Edge có sẵn (Playwright, không tải trình duyệt).
# Chạy trên CSDL dev: npm run db:reset  ->  npm run dev  ->  python scripts/e2e.py <thư mục ảnh>
import re, sys, pathlib, os
import psycopg2
from playwright.sync_api import sync_playwright

BASE = os.environ.get('BASE', 'http://localhost:3000')
SHOTS = pathlib.Path(sys.argv[1] if len(sys.argv) > 1 else 'e2e-shots'); SHOTS.mkdir(parents=True, exist_ok=True)
def _db_url():
    # Ưu tiên biến môi trường E2E_DB, không có thì lấy DATABASE_URL đang bật trong .env.local
    if os.environ.get('E2E_DB'): return os.environ['E2E_DB']
    env = pathlib.Path(__file__).resolve().parent.parent / '.env.local'
    for line in env.read_text(encoding='utf-8').splitlines():
        if line.startswith('DATABASE_URL='): return line.split('=', 1)[1].strip()
    sys.exit('Thiếu E2E_DB hoặc DATABASE_URL trong .env.local')
db = psycopg2.connect(_db_url())
db.autocommit = True
def one(sql, *a):
    with db.cursor() as c:
        c.execute(sql, a); return c.fetchone()

results = []
def check(name, ok, info=''):
    results.append((name, ok)); print(('PASS ' if ok else 'FAIL ') + name + (f' — {info}' if info else ''), flush=True)

def login(page, ten):
    page.goto(f'{BASE}/dang-nhap')
    page.locator('button', has_text=ten).click()
    page.wait_for_url(lambda u: '/dang-nhap' not in u, timeout=30000)
    page.wait_for_load_state('networkidle')

def shot(page, name):
    page.screenshot(path=str(SHOTS / f'{name}.png'), full_page=True)

def wait_msg(page):
    loc = page.locator('.msg-ok, .msg-error').last
    loc.wait_for(timeout=20000)
    return loc.get_attribute('class'), loc.inner_text()

def chon_khung(page):
    page.locator('a', has_text=re.compile(r'^\d\d:\d\d$')).first.click()
    page.wait_for_url(re.compile('gio='))
    page.locator('a', has_text=re.compile(r'^Ghế \d$')).first.click()
    page.wait_for_url(re.compile('ghe='))

with sync_playwright() as p:
    br = p.chromium.launch(channel='msedge', headless=True)
    page = br.new_page(viewport={'width': 1440, 'height': 900}, locale='vi-VN')
    page.on('dialog', lambda d: d.accept())
    page.set_default_timeout(30000)

    # 0. Chưa đăng nhập -> về /dang-nhap (kiểm proxy.ts)
    page.goto(f'{BASE}/hoa-don'); page.wait_for_load_state('networkidle')
    check('Chưa đăng nhập bị đưa về /dang-nhap', '/dang-nhap' in page.url, page.url)
    shot(page, '00-dang-nhap')

    # 1. Lễ tân đăng nhập
    login(page, 'LT Hoa')
    check('Lễ tân vào trang Lịch hẹn', '/lich-hen' in page.url, page.url)
    shot(page, '01-lich-hen')

    # 2. Đặt lịch cho Trần Gia Hân (dùng số của mẹ — QĐ2) vào ngày mai
    mai, bs = one("""SELECT current_date + 1, (SELECT ct.nhan_vien_id FROM ca_truc ct JOIN nhan_vien nv ON nv.id = ct.nhan_vien_id
                     WHERE nv.vai_tro='bac_si' AND ct.ngay = current_date + 1 ORDER BY ct.nhan_vien_id LIMIT 1)""")
    page.goto(f'{BASE}/lich-hen/dat?tim=0909000111')
    check('Tìm SĐT 0909000111 ra 3 hồ sơ (L1, QĐ2)', page.get_by_text('Tìm thấy 3 hồ sơ').count() == 1)
    page.get_by_role('link', name=re.compile('Trần Gia Hân')).click()
    page.wait_for_url(re.compile('bn=3'))
    page.fill('input[name=ngay]', str(mai))
    page.select_option('select[name=bs]', str(bs))
    page.get_by_role('button', name='Xem khung trống').click()
    page.wait_for_url(re.compile('bs='))
    chon_khung(page)
    page.select_option('select[name=dich_vu]', label='Trám răng')
    shot(page, '02-dat-lich')
    page.get_by_role('button', name='Lưu lịch hẹn').click()
    page.wait_for_url(re.compile(r'/lich-hen\?ngay='))
    lh_moi = one("SELECT id FROM lich_hen WHERE benh_nhan_id = 3 AND ngay = current_date + 1 AND trang_thai = 'da_dat' ORDER BY id DESC LIMIT 1")
    check('Lưu lịch hẹn mới vào CSDL', lh_moi is not None)

    # 3. Dời lịch vừa đặt: hủy với lý do "dời lịch" rồi đặt khung khác, hai lịch liên kết (P5)
    page.goto(f'{BASE}/lich-hen/{lh_moi[0]}')
    shot(page, '04-huy-doi-lich')
    page.get_by_role('button', name=re.compile('Dời sang khung khác')).click()
    page.wait_for_url(re.compile(r'doi=\d+'))
    page.get_by_role('button', name='Xem khung trống').click()
    page.wait_for_url(re.compile('bs='))
    chon_khung(page)
    page.get_by_role('button', name='Lưu lịch hẹn').click()
    page.wait_for_url(re.compile(r'/lich-hen\?ngay='))
    r = one("""SELECT o.trang_thai, o.ly_do_huy_ma, n.id IS NOT NULL FROM lich_hen o
               LEFT JOIN lich_hen n ON n.doi_tu_lich_hen_id = o.id AND n.trang_thai = 'da_dat' WHERE o.id = %s""", lh_moi[0])
    check('Dời lịch: lịch cũ hủy "doi_lich", lịch mới trỏ về lịch cũ', r == ('da_huy', 'doi_lich', True), str(r))
    lh_doi = one('SELECT id FROM lich_hen WHERE doi_tu_lich_hen_id = %s', lh_moi[0])[0]

    # 4. Hủy lịch mới (bắt buộc lý do — L10)
    page.goto(f'{BASE}/lich-hen/{lh_doi}')
    page.locator('select[name=ly_do]').select_option('quen_lich')
    page.get_by_role('button', name='Xác nhận hủy').click()
    page.wait_for_load_state('networkidle')
    page.get_by_text('Đã hủy').first.wait_for()
    r = one('SELECT trang_thai, ly_do_huy_ma, nguoi_ghi_huy_id, huy_luc IS NOT NULL FROM lich_hen WHERE id = %s', lh_doi)
    check('Hủy lịch ghi đủ lý do / người (LT Hoa = 5) / thời điểm', r == ('da_huy', 'quen_lich', 5, True), str(r))

    # 5. Tiếp nhận: lịch hôm nay đang chờ -> đã đến
    lh, ten_bs, ten_bn = one("""SELECT lh.id, nv.ho_ten, bn.ho_ten FROM lich_hen lh JOIN nhan_vien nv ON nv.id = lh.bac_si_id
                               JOIN benh_nhan bn ON bn.id = lh.benh_nhan_id
                               WHERE lh.ngay = current_date AND lh.trang_thai IN ('da_dat','da_nhac') ORDER BY lh.gio_bat_dau LIMIT 1""")
    page.goto(f'{BASE}/tiep-nhan')
    shot(page, '06-tiep-nhan')
    page.locator(f'form:has(input[name=id][value="{lh}"]) button').first.click()
    page.wait_for_load_state('networkidle'); page.wait_for_timeout(1000)
    r = one('SELECT trang_thai, den_luc IS NOT NULL FROM lich_hen WHERE id = %s', lh)
    check('Tiếp nhận: lịch chuyển "đã đến", ghi giờ đến', r == ('da_den', True), str(r))

    # 6. Bác sĩ khám: mở phiếu, việc theo răng, kê thuốc, ghi vật tư, hoàn kho 1 dòng thuốc, hoàn tất
    ten_ngan = 'BS ' + ten_bs.split()[-1]
    login(page, ten_ngan)
    check(f'{ten_ngan} vào trang Phiếu điều trị', '/phieu-dieu-tri' in page.url, page.url)
    page.locator(f'form:has(input[name=lich][value="{lh}"]) button').click()
    page.wait_for_url(re.compile(r'/phieu-dieu-tri/\d+'))
    phieu = int(re.search(r'/phieu-dieu-tri/(\d+)', page.url).group(1))
    # Dịch vụ theo răng mà bỏ trống răng -> trigger chặn (L4)
    page.select_option('#them-viec select[name=dich_vu]', label='Trám răng')
    page.get_by_role('button', name='+ Thêm việc').click()
    cls, msg = wait_msg(page)
    check('Trám răng không ghi số răng bị chặn (L4)', 'msg-error' in cls and 'số răng' in msg, msg)
    page.get_by_role('link', name='36', exact=True).click()
    page.wait_for_url(re.compile('rang=36'))
    page.select_option('#them-viec select[name=dich_vu]', label='Trám răng')
    page.get_by_role('button', name='+ Thêm việc').click()
    page.locator('td', has_text='Trám răng').first.wait_for()
    page.select_option('select[name=thuoc]', '3')
    page.fill('input[name=lieu_dung]', 'Ngày 2 lần, mỗi lần 1 viên sau ăn')
    page.get_by_role('button', name=re.compile('Kê thuốc')).click()
    page.locator('td', has_text='Ibuprofen').first.wait_for()
    check('Kê đơn trừ kho Ibuprofen (400 → 390)', float(one("SELECT ton_kho FROM vat_tu WHERE ma = 'IBU'")[0]) == 390)
    page.locator('form:has(button[title="Hủy kê, hoàn kho"]) button').first.click()
    page.get_by_text('đã hoàn kho').first.wait_for(timeout=20000)
    check('Hoàn kho dòng thuốc kê nhầm (Ibuprofen về 400, dòng gạch ngang)', float(one("SELECT ton_kho FROM vat_tu WHERE ma = 'IBU'")[0]) == 400)
    page.select_option('select[name=thuoc]', '1')
    page.fill('input[name=lieu_dung]', 'Uống khi đau, cách 6 giờ')
    page.get_by_role('button', name=re.compile('Kê thuốc')).click()
    page.locator('td', has_text='Paracetamol').first.wait_for()
    page.select_option('select[name=vat_tu]', '6')
    page.select_option('select[name=viec]', index=1)
    page.get_by_role('button', name=re.compile('Ghi vật tư')).click()
    page.locator('td', has_text='Composite').first.wait_for()
    shot(page, '08-phieu-dieu-tri')
    page.get_by_role('button', name=re.compile('Hoàn tất')).click()
    page.get_by_text('Đã chuyển lễ tân thu tiền').wait_for(timeout=20000)
    r = one("""SELECT (SELECT count(*) FROM chi_tiet_dieu_tri WHERE phieu_id = %s AND rang_so = 36),
                      (SELECT count(*) FROM don_thuoc WHERE phieu_id = %s),
                      (SELECT count(*) FROM lich_su_sua_phieu WHERE phieu_id = %s AND nhan_vien_id IS NOT NULL),
                      (SELECT trang_thai FROM lich_hen WHERE id = %s),
                      (SELECT trang_thai || (hoan_tat_luc IS NOT NULL)::text FROM phieu_dieu_tri WHERE id = %s),
                      (SELECT count(*) FROM giao_dich_kho WHERE phieu_id = %s AND loai = 'xuat_dung')""", phieu, phieu, phieu, lh, phieu, phieu)
    check('Phiếu: việc R36, 2 dòng thuốc, lịch sử có người sửa, lịch "hoàn thành", phiếu "hoàn tất", vật tư gắn phiếu',
          r[0] == 1 and r[1] == 2 and r[2] >= 3 and r[3] == 'hoan_thanh' and r[4] == 'hoan_tattrue' and r[5] == 1, str(r))

    # 7. Lễ tân lập hóa đơn, giảm giá cả hóa đơn (QĐ3), thu một phần, chặn thu quá (L9)
    login(page, 'LT Hoa')
    page.goto(f'{BASE}/hoa-don')
    page.locator(f'li:has-text("{ten_bn}") button', has_text='Lập hóa đơn').first.click()
    page.wait_for_url(re.compile(r'/hoa-don/\d+'))
    hd = int(re.search(r'/hoa-don/(\d+)', page.url).group(1))
    tong0 = one('SELECT tong_tien FROM v_cong_no_hoa_don WHERE hoa_don_id = %s', hd)[0]
    gia = one('SELECT don_gia FROM chi_tiet_hoa_don WHERE hoa_don_id = %s AND chi_tiet_dieu_tri_id IS NOT NULL', hd)[0]
    check('Giá trám chốt theo bảng giá hiện hành (350.000 — L5)', gia == 350000, str(gia))
    page.fill('input[name=so_tien][placeholder^="Số tiền giảm"]', '50000')
    page.fill('input[name=ly_do]', 'Khách quen')
    page.get_by_role('button', name='Áp dụng').click()
    page.wait_for_timeout(1500)
    tong1 = one('SELECT tong_tien FROM v_cong_no_hoa_don WHERE hoa_don_id = %s', hd)[0]
    check('Giảm 50.000 cả hóa đơn được chia xuống dòng', tong0 - tong1 == 50000 and one('SELECT sum(giam_gia) FROM chi_tiet_hoa_don WHERE hoa_don_id=%s', hd)[0] == 50000, f'{tong0} -> {tong1}')
    page.fill('input[name=so_tien][class*="text-lg"]', '999999999')
    page.get_by_role('button', name='Thu tiền', exact=True).click()
    loi = page.locator('.msg-error', has_text='chỉ còn nợ')
    loi.wait_for(timeout=20000)
    check('Chặn thu quá số còn nợ', loi.count() == 1, loi.inner_text())
    page.reload()
    page.fill('input[name=so_tien][class*="text-lg"]', '100000')
    page.get_by_role('button', name='Thu tiền', exact=True).click()
    page.wait_for_timeout(1500)
    r = one('SELECT da_thu, con_no, tong_tien FROM v_cong_no_hoa_don WHERE hoa_don_id = %s', hd)
    check('Thu 100.000, còn nợ = tổng − 100.000', r[0] == 100000 and r[1] == r[2] - 100000, str(r))
    shot(page, '11-hoa-don')

    # 8. Nhắc lịch ngày mai, đối soát
    page.goto(f'{BASE}/nhac-lich')
    shot(page, '05-nhac-lich')
    btn = page.get_by_role('button', name='Nghe máy').first
    if btn.count():
        truoc = one("SELECT count(*) FROM nhac_lich WHERE thoi_diem::date = current_date AND ket_qua='nghe_may'")[0]
        btn.click(); page.wait_for_timeout(1500)
        check('Ghi "nghe máy" -> thêm một dòng nhắc lịch', one("SELECT count(*) FROM nhac_lich WHERE thoi_diem::date = current_date AND ket_qua='nghe_may'")[0] == truoc + 1)
    page.goto(f'{BASE}/doi-soat'); shot(page, '13-doi-soat')

    # 9. Quản lý: ca trùng buổi bị chặn, giá mới, nhập kho, danh mục
    login(page, 'QL Minh')
    check('Quản lý vào Báo cáo tháng', '/bao-cao' in page.url, page.url)
    page.wait_for_timeout(500)
    shot(page, '18-bao-cao')
    page.goto(f'{BASE}/ca-truc')
    ngay_ca, buoi = one("SELECT ngay, buoi FROM ca_truc WHERE nhan_vien_id = 1 AND ngay > current_date ORDER BY ngay LIMIT 1")
    page.select_option('select[name=nv]', '1')
    page.fill('input[name=ngay]', str(ngay_ca))
    page.select_option('select[name=buoi]', buoi)
    page.get_by_role('button', name='Lưu ca').click()
    cls, msg = wait_msg(page)
    check('Chặn ca trùng buổi của cùng bác sĩ', 'msg-error' in cls and 'buổi' in msg, msg)
    shot(page, '14-ca-truc')
    page.goto(f'{BASE}/bang-gia?dv=2')
    page.fill('input[name=don_gia]', '220000')
    page.get_by_role('button', name='Lưu giá mới').click()
    cls, msg = wait_msg(page)
    check('Đặt giá mới cho Cạo vôi', 'msg-ok' in cls, msg)
    r = one("SELECT count(*), count(*) FILTER (WHERE hieu_luc_den IS NULL) FROM bang_gia WHERE dich_vu_id = 2")
    check('Giá cũ được đóng, chỉ 1 giá mở', r == (2, 1), str(r))
    shot(page, '15-bang-gia')
    page.goto(f'{BASE}/kho?loc=sap_het&vt=5')
    page.fill('input[name=so_luong][min="1"]', '20')
    page.get_by_role('button', name='Lưu phiếu nhập').click()
    page.wait_for_timeout(1500)
    check('Nhập kho Lidocain 20 ống (6 → 26)', float(one("SELECT ton_kho FROM vat_tu WHERE ma='LIDO'")[0]) == 26)
    shot(page, '17-kho')
    page.goto(f'{BASE}/cong-no'); shot(page, '16-cong-no')
    page.goto(f'{BASE}/lieu-trinh/1'); shot(page, '10-lieu-trinh')
    page.goto(f'{BASE}/danh-muc?tab=ghe')
    page.locator('form:has(input[name=id][value="3"]) button').click()
    page.wait_for_timeout(1500)
    check('Danh mục: tạm ngừng Ghế 3', one('SELECT dang_hoat_dong FROM ghe WHERE id = 3')[0] is False)
    page.goto(f'{BASE}/lich-hen'); page.wait_for_load_state('networkidle')
    check('Lưới lịch hẹn chỉ còn 2 ghế', page.locator('th', has_text='Ghế 3').count() == 0)
    page.goto(f'{BASE}/danh-muc?tab=ghe')
    page.locator('form:has(input[name=id][value="3"]) button').click()
    page.wait_for_timeout(1500)
    check('Danh mục: mở lại Ghế 3', one('SELECT dang_hoat_dong FROM ghe WHERE id = 3')[0] is True)
    page.goto(f'{BASE}/danh-muc'); shot(page, '19-danh-muc')

    # 10. Lễ tân không vào được trang quản lý
    login(page, 'LT Lan')
    page.goto(f'{BASE}/bao-cao')
    page.wait_for_url(re.compile('/khong-quyen'), timeout=20000)
    check('Lễ tân bị chặn ở Báo cáo (chuyển /khong-quyen)', page.get_by_text('Bạn không có quyền mở trang này').count() == 1)
    br.close()

ok = sum(ok for _, ok in results)
print(f"\n{ok}/{len(results)} PASS")
sys.exit(0 if ok == len(results) else 1)
