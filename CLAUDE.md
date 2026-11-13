@AGENTS.md

# Phòng khám Nha khoa Nụ Cười Việt — website quản lý (CSDL PhongKhamRang)

- Đọc `docs/kien-truc.md` trước khi sửa code; mọi tính năng mới / sửa / xóa phải cập nhật tài liệu này theo `.claude/rules/cap-nhat-kien-truc.md`.
- Use case, luật L1–L14, giả định, quyết định thiết kế, wireframe: thư mục tài liệu trên Google Drive `Thuc_Hanh_Buoi_3` (`.claude/docs/use-case.md`, `database/quyet-dinh.md`, `wireframe/phong-kham-rang.drawio`).
- **Hai project tách riêng:** `frontend/` (giao diện, https://vndental-app.vercel.app) gọi `backend/` (API + CSDL, https://be-vndental.vercel.app) qua `BACKEND_URL`. Chỉ backend được nối CSDL. Đọc `.claude/rules/frontend-backend.md` trước khi thêm màn, thao tác ghi hay truy vấn.
- `npm run db:reset` (trong `backend/`) xóa sạch CSDL trong `backend/.env.local` — chỉ dùng với `PhongKhamRang_dev`, không trỏ vào `PhongKhamRang` hay Neon.
