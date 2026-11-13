# Phòng khám Nha khoa Nụ Cười Việt — website quản lý

Next.js 16 + PostgreSQL 17 (CSDL **PhongKhamRang**). Kiến trúc: [docs/kien-truc.md](docs/kien-truc.md).

## Cài đặt và chạy

1. PostgreSQL chạy trong Docker: container `PhongKhamRangNCV` (cổng 5432). Kiểm tra: `docker ps`.
2. `copy .env.example .env.local` rồi điền mật khẩu của `Sang_admin` (ký tự `@` viết `%40`).
3. `npm install`
4. (CSDL trống) `node --env-file=.env.local scripts/db-init.mjs --seed` — tạo bảng + dữ liệu mẫu.
5. `npm run dev` → <http://localhost:3000>

| Lệnh | Việc |
| --- | --- |
| `npm run dev` | Chạy local |
| `npm run build` · `npm start` | Bản production |
| `npm run typecheck` · `npx eslint src` | Kiểm tra kiểu, lint |
| `npm run db:init` | Tạo bảng từ `db/schema.sql` (CSDL phải trống) |
| `npm run db:reset` | **Xóa sạch** schema rồi tạo lại + seed — chỉ dùng với `PhongKhamRang_dev` |
| `powershell -File scripts/smoke.ps1` | Gọi mọi route theo vai trò |
| `python scripts/e2e.py e2e-shots` | Kiểm thử đầu-cuối trên Edge (cần `pip install playwright psycopg2-binary`) |

## Tài khoản demo (chọn ở màn đăng nhập, chưa có mật khẩu)

| Người | Vai trò | Trang chủ |
| --- | --- | --- |
| LT Hoa, LT Lan | Lễ tân (ca sáng / chiều) | Lịch hẹn |
| BS An, BS Bình, BS Chi, BS Dũng (bán thời gian) | Bác sĩ | Phiếu điều trị |
| QL Minh | Quản lý (toàn quyền) | Báo cáo tháng |

## Màn hình ↔ use case

Lịch hẹn (UC01–UC04) · Nhắc lịch (UC03) · Tiếp nhận (UC05–UC06) · Bệnh nhân (UC06–UC07) · Phiếu điều trị (UC08–UC12, UC14) ·
Liệu trình (UC13) · Hóa đơn & thu tiền (UC15–UC16) · Đối soát (UC17) · Ca trực (UC18) · Bảng giá (UC19) · Công nợ (UC20) ·
Kho (UC21) · Báo cáo tháng (UC22) · Nhân viên & danh mục (UC23). Chi tiết: mục 4 của [docs/kien-truc.md](docs/kien-truc.md).

## Giới hạn

Đăng nhập chưa có mật khẩu; SMS nhắc lịch chỉ ghi nhận, chưa gửi thật; một cơ sở. Xem mục 11 của tài liệu kiến trúc.
