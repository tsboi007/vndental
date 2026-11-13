import 'server-only'
import { ChuyenTrang, LoiApi } from './ket-qua'

// Kết quả một lệnh ghi trả về frontend. token: phiên mới (sau khi đổi mật khẩu).
export type ActionState = { ok?: string; error?: string; at?: number; token?: string } | undefined

type PgError = { code?: string; constraint?: string; message?: string }

// Đổi lỗi PostgreSQL thành câu tiếng Việt dễ hiểu cho người dùng.
const RANG_BUOC: Record<string, string> = {
  ux_lich_hen_ghe: 'Ghế này đã có lịch ở khung giờ đó.',
  ux_lich_hen_bac_si: 'Bác sĩ đã có lịch ở khung giờ đó.',
  ux_benh_nhan_nguoi: 'Đã có hồ sơ trùng số điện thoại + họ tên + ngày sinh.',
  vat_tu_ton_kho_check: 'Không đủ tồn kho.',
  ca_truc_nhan_vien_id_tsrange_excl: 'Ca bị chồng giờ với một ca khác của người này trong ngày.',
  bang_gia_dich_vu_id_daterange_excl: 'Khoảng hiệu lực giá bị chồng với một mức giá khác.',
  chi_tiet_hoa_don_check: 'Giảm giá không được lớn hơn thành tiền của dòng.',
  doi_soat_cuoi_ngay_ngay_key: 'Ngày này đã được chốt đối soát.',
  chi_tiet_hoa_don_chi_tiet_dieu_tri_id_key: 'Việc này đã được lập hóa đơn.',
  chi_tiet_hoa_don_don_thuoc_id_key: 'Thuốc này đã được lập hóa đơn.',
  chi_tiet_hoa_don_lieu_trinh_dot_id_key: 'Đợt này đã được lập hóa đơn.',
  vat_tu_ma_key: 'Mã này đã tồn tại.',
  dich_vu_ma_key: 'Mã dịch vụ đã tồn tại.',
  benh_nhan_sdt_check: 'Số điện thoại phải gồm 10–11 chữ số, bắt đầu bằng 0.',
  benh_nhan_check: 'Số điện thoại của người giám hộ thì phải ghi tên người giám hộ.',
  benh_nhan_ma_ho_so_giay_key: 'Mã hồ sơ giấy này đã được nhập cho người khác.',
  benh_nhan_ma_ho_so_key: 'Mã hồ sơ đã tồn tại.',
  ca_truc_nhan_vien_id_ngay_buoi_key: 'Người này đã có ca buổi đó trong ngày.',
  ca_truc_check: 'Giờ kết thúc ca phải sau giờ bắt đầu.',
  ca_truc_check1: 'Ca phải nằm trong giờ mở cửa (8h–20h, Chủ nhật 8h–17h).',
  doi_soat_cuoi_ngay_check: 'Có chênh lệch thì phải ghi chú lý do.',
  lieu_trinh_dot_lieu_trinh_id_dot_so_key: 'Số đợt này đã có trong liệu trình.',
  nhan_vien_ten_dang_nhap_key: 'Tên đăng nhập đã có người dùng.',
  ghe_ten_key: 'Tên ghế đã tồn tại.',
  ly_do_huy_pkey: 'Mã lý do đã tồn tại.',
  chi_tiet_dieu_tri_rang_so_check: 'Số răng không đúng hệ FDI (11–48, răng sữa 51–85).',
  giao_dich_kho_check: 'Số lượng không hợp lệ (nhập phải > 0; điều chỉnh phải ghi chú).',
  phieu_dieu_tri_lich_hen_id_key: 'Lịch hẹn này đã có phiếu điều trị.',
  lich_hen_check1: 'Hủy lịch phải ghi đủ lý do, bên hủy và người ghi nhận.',
  vat_tu_check: 'Chỉ thuốc mới có giá bán.',
}

export function loiTiengViet(e: unknown): string {
  const err = e as PgError
  if (err.constraint && RANG_BUOC[err.constraint]) return RANG_BUOC[err.constraint]
  if (err.code === 'P0001' && err.message) return err.message // RAISE EXCEPTION trong trigger, đã là tiếng Việt
  if (err.code === '23514' && err.constraint?.startsWith('lich_hen')) return 'Khung giờ không hợp lệ hoặc ngoài giờ mở cửa.'
  if (err.code === '23505') return 'Dữ liệu bị trùng.'
  if (err.code === '23503') return 'Dữ liệu đang được dùng ở nơi khác, không xóa được.'
  if (err.code === '22P02' || err.code === '22007' || err.code === '22008') return 'Giá trị nhập không đúng định dạng.'
  if (e instanceof Error) return e.message
  return 'Có lỗi xảy ra.'
}

// Bọc một thao tác ghi: trả { ok } hoặc { error } (frontend tự làm mới trang khi ok).
export async function run(fn: () => Promise<string | void>): Promise<ActionState> {
  try {
    const msg = await fn()
    return { ok: msg || 'Đã lưu.', at: Date.now() }
  } catch (e) {
    if (e instanceof ChuyenTrang || e instanceof LoiApi) throw e
    return { error: loiTiengViet(e), at: Date.now() }
  }
}

export function s(fd: FormData, k: string): string {
  return String(fd.get(k) ?? '').trim()
}

export function n(fd: FormData, k: string): number {
  const v = s(fd, k).replace(/[.\s]/g, '').replace(',', '.')
  return v === '' ? NaN : Number(v)
}

export function batBuoc(...cap: [string, string][]): void {
  for (const [v, ten] of cap) if (!v) throw new Error(`Thiếu ${ten}.`)
}
