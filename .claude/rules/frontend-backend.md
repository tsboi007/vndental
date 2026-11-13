# Quy tắc: frontend và backend trong dự án

Dự án gồm **hai ứng dụng Next.js 16 deploy riêng** trên Vercel:

| | Thư mục | Production | Local | Được phép |
| --- | --- | --- | --- | --- |
| **Frontend** | `frontend/` | https://vndental-app.vercel.app (project `vndental-app`) | :3000 | Giao diện, Server Component, Server Action mỏng, cookie phiên |
| **Backend** | `backend/` | https://be-vndental.vercel.app (project `bevndental`) | :3001 | API JSON, SQL, mật khẩu, ký / kiểm token |
| **CSDL** | `backend/db/` | Neon `neondb` (Singapore) | Docker `PhongKhamRang_dev` | Luật nghiệp vụ thật (CHECK, UNIQUE, EXCLUDE, trigger, view) |

**Chỉ backend nối CSDL và biết `SESSION_SECRET`.** Frontend gọi backend server-to-server qua `BACKEND_URL` (`frontend/src/lib/api.ts`), kèm token trong header `Authorization: Bearer`. Trình duyệt không gọi thẳng backend → backend không mở CORS.

## API của backend

| API | Việc | Code |
| --- | --- | --- |
| `POST /api/dang-nhap` | Kiểm mật khẩu, cấp token | `backend/src/app/api/dang-nhap/route.ts` |
| `GET /api/toi` | Token là của ai (+ số vật tư sắp hết) | `backend/src/app/api/toi/route.ts` |
| `GET /api/trang/<tên>?…` | Dữ liệu một màn hình | `backend/src/trang/<tên>.ts`, bảng tra `src/trang/index.ts` |
| `POST /api/lenh/<tênHàm>` | Một thao tác ghi (FormData) | `backend/src/lenh/<nhóm>.ts`, bảng tra `src/lenh/index.ts` |

Mọi API đi qua `xuLy()` (`backend/src/lib/api.ts`): token → nhân viên (AsyncLocalStorage) → `requireNhanVien` trong từng hàm → JSON. 401 / 403 / 404 → frontend chuyển `/dang-nhap` / `/khong-quyen` / notFound.

## Khi sửa code

1. **Thêm / đổi dữ liệu một màn:** sửa `backend/src/trang/<tên>.ts` (dòng đầu luôn `await requireNhanVien(...)`), rồi `cd backend && npm run sinh-kieu` để cập nhật `frontend/src/kieu/` (không sửa tay thư mục này), rồi sửa JSX ở `frontend/src/app/(app)/<route>/page.tsx`.
2. **Thêm thao tác ghi:** hàm `(_: ActionState, fd: FormData) => Promise<ActionState>` trong `backend/src/lenh/<nhóm>.ts`, tên **duy nhất** trong `LENH`, kiểm vai trò, ghi qua `tx(nv.id, …)`; muốn chuyển trang thì `redirect()` của `@/lib/ket-qua`. Frontend: `export async function x(_, fd) { return lenh('x', fd) }` trong `actions.ts`.
3. **Không được:** cài `pg` hay đọc `DATABASE_URL` / `SESSION_SECRET` ở frontend; tin cookie `vt` hay `requireNhanVien` của frontend để phân quyền (chỉ dùng chuyển trang — quyền thật ở backend); trả `undefined` / hàm / `Date` từ hàm trang (JSON bỏ mất — dùng `null`, chuỗi).
4. **Luật nghiệp vụ** ưu tiên đặt ở CSDL; thêm câu báo lỗi tiếng Việt vào `RANG_BUOC` (`backend/src/lib/action.ts`).
5. **Deploy:** `cd backend && vercel deploy --prod`, `cd frontend && vercel deploy --prod` (đổi API thì deploy backend trước).
6. Đổi bất kỳ lớp nào ở trên → cập nhật `docs/kien-truc.md` theo [cap-nhat-kien-truc.md](cap-nhat-kien-truc.md).
