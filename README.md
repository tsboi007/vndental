# Phòng khám Nha khoa Nụ Cười Việt — website quản lý

Hai project Next.js 16 tách riêng + PostgreSQL. Kiến trúc: [docs/kien-truc.md](docs/kien-truc.md).

| | Thư mục | Production | Local |
| --- | --- | --- | --- |
| Frontend (giao diện) | [frontend/](frontend/) | https://vndental-app.vercel.app | http://localhost:3000 |
| Backend (API + CSDL) | [backend/](backend/) | https://be-vndental.vercel.app | http://localhost:3001 |
| CSDL | [backend/db/](backend/db/) | Neon `neondb` (Singapore) | Docker `PhongKhamRangNCV` (`PhongKhamRang_dev`) |

## Cài đặt và chạy local

1. PostgreSQL trong Docker: container `PhongKhamRangNCV` (cổng 5432). Kiểm tra: `docker ps`.
2. Backend: `cd backend` → `copy .env.example .env.local` (điền mật khẩu `Sang_admin`, `@` viết `%40`, và `SESSION_SECRET`) → `npm install` → (CSDL trống) `node --env-file=.env.local scripts/db-init.mjs --seed` → `npm run dev` (:3001).
3. Frontend: `cd frontend` → `copy .env.example .env.local` → `npm install` → `npm run dev` → <http://localhost:3000>.
4. Cấp mật khẩu cho nhân viên: `cd backend && node --env-file=.env.local scripts/dat-mat-khau.mjs --chua-dat`.

| Lệnh | Việc |
| --- | --- |
| `npm run dev` · `npm run build` (mỗi thư mục) | Chạy local · build production |
| `npm run typecheck` · `npx eslint src` (mỗi thư mục) | Kiểm tra kiểu, lint |
| `npm run sinh-kieu` (backend) | Sinh kiểu dữ liệu từng màn cho frontend (`frontend/src/kieu/`) |
| `npm run db:init` · `npm run db:reset` (backend) | Tạo bảng · **xóa sạch** rồi tạo lại + seed — chỉ dùng với `PhongKhamRang_dev` |
| `vercel deploy --prod` (mỗi thư mục) | Deploy (backend trước nếu đổi API) |
| `powershell -File scripts/smoke.ps1` | Gọi mọi route theo vai trò (cần 2 dev server) |
| `python scripts/e2e.py e2e-shots` | Kiểm thử đầu-cuối trên Edge (cần `pip install playwright psycopg2-binary`) |

## Đăng nhập

Tên đăng nhập + mật khẩu (mật khẩu do quản lý cấp, mỗi người tự đổi ở mục **Mật khẩu**). Quản lý đặt lại mật khẩu ở **Nhân viên & danh mục**.

## Màn hình ↔ use case

Lịch hẹn (UC01–UC04) · Nhắc lịch (UC03) · Tiếp nhận (UC05–UC06) · Bệnh nhân (UC06–UC07) · Phiếu điều trị (UC08–UC12, UC14) ·
Liệu trình (UC13) · Hóa đơn & thu tiền (UC15–UC16) · Đối soát (UC17) · Ca trực (UC18) · Bảng giá (UC19) · Công nợ (UC20) ·
Kho (UC21) · Báo cáo tháng (UC22) · Nhân viên & danh mục (UC23). Chi tiết: mục 4 của [docs/kien-truc.md](docs/kien-truc.md).

## Giới hạn

SMS nhắc lịch chỉ ghi nhận, chưa gửi thật; chưa giới hạn số lần đăng nhập sai; một cơ sở. Xem mục 11 của tài liệu kiến trúc.
