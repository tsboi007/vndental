import type { ActionState } from '@/lib/action'
import * as bangGia from './bang-gia'
import * as benhNhan from './benh-nhan'
import * as caTruc from './ca-truc'
import * as danhMuc from './danh-muc'
import * as doiMatKhau from './doi-mat-khau'
import * as doiSoat from './doi-soat'
import * as hoaDon from './hoa-don'
import * as kho from './kho'
import * as lichHen from './lich-hen'
import * as lieuTrinh from './lieu-trinh'
import * as nhacLich from './nhac-lich'
import * as phieuDieuTri from './phieu-dieu-tri'

// Mọi lệnh ghi, tra theo tên hàm: POST /api/lenh/<tên>. Mỗi hàm tự kiểm vai trò bằng requireNhanVien.
export type Lenh = (state: ActionState, fd: FormData) => Promise<ActionState>

export const LENH: Record<string, Lenh> = {
  ...bangGia, ...benhNhan, ...doiSoat, ...kho, ...caTruc, ...danhMuc, ...doiMatKhau, ...hoaDon, ...lichHen, ...lieuTrinh, ...nhacLich, ...phieuDieuTri,
}
