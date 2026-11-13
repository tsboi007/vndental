# Quy tắc: frontend và backend trong dự án

Dự án là **một ứng dụng Next.js 16 duy nhất**, không có thư mục `frontend/` và `backend/` riêng, không có REST API. Ranh giới frontend / backend nằm **trong từng file**, theo chỉ thị `'use client'` / `'use server'` / `import 'server-only'`. Đừng tách repo, đừng thêm Express/API route chỉ để "có backend" — muốn thêm API thì hỏi người dùng trước và ghi vào `docs/kien-truc.md`.

## Bản đồ

| Lớp | Chạy ở đâu | File | Việc của nó |
| --- | --- | --- | --- |
| **Frontend — client** | Trình duyệt | `src/components/ActionForm.tsx`, `NavLink.tsx`, `PrintButton.tsx`, `src/app/(app)/error.tsx` (có `'use client'`) | Tương tác: gửi form + hiện thông báo, tô menu đang chọn, nút in, màn lỗi. Không đụng CSDL. |
| **Frontend — giao diện render trên server** | Node.js (gửi HTML về trình duyệt) | `src/app/**/page.tsx`, `layout.tsx`, `src/components/ui.tsx`, `Skeleton.tsx`, `src/app/globals.css` (Tailwind 4) | Server Component: đọc dữ liệu qua `src/lib/data.ts` / `q()` rồi dựng HTML. Không có `'use client'`. |
| **Backend — chặn cửa** | Node.js, trước mọi request | `src/proxy.ts` | Chưa có cookie `nv` → `/dang-nhap`; `/` → trang chủ theo vai trò. Chỉ kiểm tra nhanh. |
| **Backend — xử lý ghi** | Node.js | `src/app/**/actions.ts` (`'use server'`, 12 file) | Server Action: `requireNhanVien(vai_tro)` → kiểm tra dữ liệu form → SQL trong `tx()` → `refresh()` / `redirect()`. |
| **Backend — thư viện** | Node.js (`import 'server-only'`) | `src/lib/db.ts` (Pool, `q`, `q1`, `tx`), `session.ts` (cookie, phân quyền), `action.ts` (`run`, đổi lỗi PG → tiếng Việt), `data.ts` (truy vấn dùng chung), `format.ts` | Mọi truy cập CSDL đi qua đây. |
| **CSDL** | Docker `PhongKhamRangNCV` (PostgreSQL 17) | `db/schema.sql`, `db/seed.sql`, `db/bao-cao.sql` | Luật nghiệp vụ thật (CHECK, UNIQUE, EXCLUDE, trigger, view). |

## Luồng một thao tác

```text
Trình duyệt ──GET──> proxy.ts ──> page.tsx (Server Component) ──> lib/data.ts ──> PostgreSQL
           <──HTML stream──────────────┘
Trình duyệt ──POST form (ActionForm, client)──> actions.ts ('use server') ──> lib/db.ts tx() ──> PostgreSQL
           <──{ ok | error tiếng Việt } + refresh()──┘
```

## Khi sửa code

1. **Đặt code đúng lớp:**
   - Truy vấn đọc → `src/lib/data.ts` (dùng lại được) hoặc ngay trong `page.tsx`.
   - Ghi dữ liệu → `actions.ts` cùng thư mục route, bọc trong `tx()`, bắt đầu bằng `requireNhanVien(...)`.
   - Luật nghiệp vụ (trùng lịch, tồn kho, giá theo ngày…) → ưu tiên ràng buộc / trigger trong `db/schema.sql`; thêm câu báo lỗi vào bảng `RANG_BUOC` trong `src/lib/action.ts`.
   - Chỉ thêm `'use client'` khi thật sự cần state / sự kiện trình duyệt; giữ component client nhỏ.
2. **Không được:** import `src/lib/db.ts`, `session.ts`, `data.ts` vào file `'use client'` (`server-only` sẽ báo lỗi build); đưa `DATABASE_URL` hoặc biến `NEXT_PUBLIC_*` chứa bí mật ra client; ghi CSDL từ `page.tsx`.
3. **Phân quyền kiểm tra 2 lần:** `proxy.ts` chỉ xem có cookie; quyền thật kiểm tra lại trong từng trang và Server Action bằng `requireNhanVien`.
4. Đổi bất kỳ lớp nào ở trên → cập nhật `docs/kien-truc.md` theo [cap-nhat-kien-truc.md](cap-nhat-kien-truc.md).
