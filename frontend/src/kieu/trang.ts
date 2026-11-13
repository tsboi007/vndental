// TỰ SINH bởi backend/scripts/sinh-kieu.mjs — không sửa tay.
// Kiểu dữ liệu GET /api/trang/<tên> của backend.
import type { bangGia } from './trang/bang-gia'
import type { baoCao } from './trang/bao-cao'
import type { benhNhanChiTiet } from './trang/benh-nhan-chi-tiet'
import type { benhNhanMoi } from './trang/benh-nhan-moi'
import type { benhNhan } from './trang/benh-nhan'
import type { caTruc } from './trang/ca-truc'
import type { congNo } from './trang/cong-no'
import type { danhMuc } from './trang/danh-muc'
import type { doiSoat } from './trang/doi-soat'
import type { hoaDonChiTiet } from './trang/hoa-don-chi-tiet'
import type { hoaDon } from './trang/hoa-don'
import type { kho } from './trang/kho'
import type { lichHenChiTiet } from './trang/lich-hen-chi-tiet'
import type { lichHenDat } from './trang/lich-hen-dat'
import type { lichHen } from './trang/lich-hen'
import type { lieuTrinhChiTiet } from './trang/lieu-trinh-chi-tiet'
import type { lieuTrinhMoi } from './trang/lieu-trinh-moi'
import type { lieuTrinh } from './trang/lieu-trinh'
import type { nhacLich } from './trang/nhac-lich'
import type { phieuChiTiet } from './trang/phieu-dieu-tri-chi-tiet'
import type { phieuDieuTri } from './trang/phieu-dieu-tri'
import type { tiepNhan } from './trang/tiep-nhan'

export type Trang = {
  'bang-gia': Awaited<ReturnType<typeof bangGia>>
  'bao-cao': Awaited<ReturnType<typeof baoCao>>
  'benh-nhan-chi-tiet': Awaited<ReturnType<typeof benhNhanChiTiet>>
  'benh-nhan-moi': Awaited<ReturnType<typeof benhNhanMoi>>
  'benh-nhan': Awaited<ReturnType<typeof benhNhan>>
  'ca-truc': Awaited<ReturnType<typeof caTruc>>
  'cong-no': Awaited<ReturnType<typeof congNo>>
  'danh-muc': Awaited<ReturnType<typeof danhMuc>>
  'doi-soat': Awaited<ReturnType<typeof doiSoat>>
  'hoa-don-chi-tiet': Awaited<ReturnType<typeof hoaDonChiTiet>>
  'hoa-don': Awaited<ReturnType<typeof hoaDon>>
  'kho': Awaited<ReturnType<typeof kho>>
  'lich-hen-chi-tiet': Awaited<ReturnType<typeof lichHenChiTiet>>
  'lich-hen-dat': Awaited<ReturnType<typeof lichHenDat>>
  'lich-hen': Awaited<ReturnType<typeof lichHen>>
  'lieu-trinh-chi-tiet': Awaited<ReturnType<typeof lieuTrinhChiTiet>>
  'lieu-trinh-moi': Awaited<ReturnType<typeof lieuTrinhMoi>>
  'lieu-trinh': Awaited<ReturnType<typeof lieuTrinh>>
  'nhac-lich': Awaited<ReturnType<typeof nhacLich>>
  'phieu-dieu-tri-chi-tiet': Awaited<ReturnType<typeof phieuChiTiet>>
  'phieu-dieu-tri': Awaited<ReturnType<typeof phieuDieuTri>>
  'tiep-nhan': Awaited<ReturnType<typeof tiepNhan>>
}
