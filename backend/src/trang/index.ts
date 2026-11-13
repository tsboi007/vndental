import type { SP } from '@/lib/api'
import { bangGia } from './bang-gia'
import { baoCao } from './bao-cao'
import { benhNhanChiTiet } from './benh-nhan-chi-tiet'
import { benhNhanMoi } from './benh-nhan-moi'
import { benhNhan } from './benh-nhan'
import { caTruc } from './ca-truc'
import { congNo } from './cong-no'
import { danhMuc } from './danh-muc'
import { doiSoat } from './doi-soat'
import { hoaDonChiTiet } from './hoa-don-chi-tiet'
import { hoaDon } from './hoa-don'
import { kho } from './kho'
import { lichHenChiTiet } from './lich-hen-chi-tiet'
import { lichHenDat } from './lich-hen-dat'
import { lichHen } from './lich-hen'
import { lieuTrinhChiTiet } from './lieu-trinh-chi-tiet'
import { lieuTrinhMoi } from './lieu-trinh-moi'
import { lieuTrinh } from './lieu-trinh'
import { nhacLich } from './nhac-lich'
import { phieuChiTiet } from './phieu-dieu-tri-chi-tiet'
import { phieuDieuTri } from './phieu-dieu-tri'
import { tiepNhan } from './tiep-nhan'

// Dữ liệu từng màn hình: GET /api/trang/<tên>. Mỗi hàm tự kiểm vai trò bằng requireNhanVien.
export const TRANG: Record<string, (sp: SP) => Promise<unknown>> = {
  'bang-gia': bangGia,
  'bao-cao': baoCao,
  'benh-nhan-chi-tiet': benhNhanChiTiet,
  'benh-nhan-moi': benhNhanMoi,
  'benh-nhan': benhNhan,
  'ca-truc': caTruc,
  'cong-no': congNo,
  'danh-muc': danhMuc,
  'doi-soat': doiSoat,
  'hoa-don-chi-tiet': hoaDonChiTiet,
  'hoa-don': hoaDon,
  'kho': kho,
  'lich-hen-chi-tiet': lichHenChiTiet,
  'lich-hen-dat': lichHenDat,
  'lich-hen': lichHen,
  'lieu-trinh-chi-tiet': lieuTrinhChiTiet,
  'lieu-trinh-moi': lieuTrinhMoi,
  'lieu-trinh': lieuTrinh,
  'nhac-lich': nhacLich,
  'phieu-dieu-tri-chi-tiet': phieuChiTiet,
  'phieu-dieu-tri': phieuDieuTri,
  'tiep-nhan': tiepNhan,
}
