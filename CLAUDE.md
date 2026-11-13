@AGENTS.md

# Phòng khám Nha khoa Nụ Cười Việt — website quản lý (CSDL PhongKhamRang)

- Đọc `docs/kien-truc.md` trước khi sửa code; mọi tính năng mới / sửa / xóa phải cập nhật tài liệu này theo `.claude/rules/cap-nhat-kien-truc.md`.
- Use case, luật L1–L14, giả định, quyết định thiết kế, wireframe: thư mục tài liệu trên Google Drive `Thuc_Hanh_Buoi_3` (`.claude/docs/use-case.md`, `database/quyet-dinh.md`, `wireframe/phong-kham-rang.drawio`).
- Frontend / backend: một app Next.js duy nhất, ranh giới theo `'use client'` / `'use server'` / `server-only` — xem `.claude/rules/frontend-backend.md` trước khi thêm trang, Server Action hay truy vấn.
- `npm run db:reset` xóa sạch CSDL trong `.env.local` — chỉ dùng với `PhongKhamRang_dev`, không trỏ vào `PhongKhamRang`.
