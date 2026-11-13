# Quy tắc: mỗi tính năng phải cập nhật tài liệu kiến trúc

Khi phát triển, sửa hoặc xóa một tính năng (màn hình, Server Action, bảng/cột/ràng buộc/trigger, luồng phân quyền, cấu hình triển khai), **cập nhật `docs/kien-truc.md` trong cùng thay đổi đó**, trước khi báo xong việc hoặc commit.

## Cập nhật những gì

| Thay đổi | Mục cần sửa trong `docs/kien-truc.md` |
| --- | --- |
| Thêm / đổi route, màn hình | 3 Cấu trúc thư mục (nếu có thư mục mới), 4 Bảng route ↔ use case |
| Thêm / đổi API, lệnh ghi (`backend/src/lenh`), dữ liệu màn (`backend/src/trang`) | 5 Luồng xử lý (nếu khác mẫu chung) |
| Đổi đăng nhập, vai trò, quyền | 6 Xác thực và phân quyền |
| Đổi `backend/src/lib/db.ts`, kết nối, múi giờ | 7 Tầng dữ liệu |
| Đổi `backend/db/schema.sql` (bảng, cột, view, trigger, ràng buộc) | 8 Mô hình dữ liệu (ERD + bảng luật) |
| Quy ước code mới | 9 Quy ước phát triển |
| Biến môi trường, hạ tầng, triển khai | 10 Môi trường và triển khai |
| Bỏ / thêm giới hạn | 11 Giới hạn hiện tại |
| **Mọi thay đổi trên** | 12 Nhật ký thay đổi — thêm 1 dòng: ngày (dd/mm/yyyy), thay đổi, mục đã sửa |

## Cách làm

1. Đọc `docs/kien-truc.md` trước khi bắt đầu để làm đúng kiến trúc hiện có.
2. Làm tính năng.
3. Sửa các mục tương ứng ở bảng trên; sơ đồ Mermaid phải khớp code thật.
4. Thêm dòng vào mục 12.
5. Nếu thay đổi chỉ là sửa lỗi nhỏ không đổi cấu trúc (không thêm route, bảng, luồng, biến môi trường): không bắt buộc, nhưng ghi rõ "không đổi kiến trúc" khi báo cáo.

Khi đổi schema, sửa luôn bản `database/schema.sql` trong thư mục tài liệu trên Google Drive và ghi lý do vào `database/quyet-dinh.md` nếu đó là quyết định thiết kế.

GitHub Action `kien-truc` sẽ chặn Pull Request sửa `frontend/`, `backend/` hoặc `scripts/` mà không sửa `docs/kien-truc.md`.
