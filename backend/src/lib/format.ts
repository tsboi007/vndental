// Định dạng & hằng số dùng chung (dùng được ở cả server và client).

const TZ = 'Asia/Ho_Chi_Minh'

export function vnd(n: number | null | undefined): string {
  return (n ?? 0).toLocaleString('vi-VN') + ' đ'
}

export function so(n: number | null | undefined): string {
  return (n ?? 0).toLocaleString('vi-VN')
}

// 'YYYY-MM-DD' của hôm nay theo giờ Việt Nam
export function homNay(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(new Date())
}

export function congNgay(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00Z')
  d.setUTCDate(d.getUTCDate() + n)
  return d.toISOString().slice(0, 10)
}

export function thuTrongTuan(iso: string): number {
  const w = new Date(iso + 'T00:00:00Z').getUTCDay()
  return w === 0 ? 7 : w // 1 = Thứ Hai … 7 = Chủ nhật
}

const TEN_THU = ['', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy', 'Chủ nhật']
const THU_NGAN = ['', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN']

export function tenThu(iso: string): string {
  return TEN_THU[thuTrongTuan(iso)]
}

export function thuNgan(iso: string): string {
  return THU_NGAN[thuTrongTuan(iso)]
}

// '2026-11-02' -> '02/11/2026'; '2026-11-02 09:05:00' -> '02/11/2026'
export function ngay(iso: string | null | undefined): string {
  if (!iso) return '—'
  const [y, m, d] = iso.slice(0, 10).split('-')
  return `${d}/${m}/${y}`
}

export function ngayDayDu(iso: string): string {
  return `${tenThu(iso)}, ${ngay(iso)}`
}

// '08:30:00' hoặc '2026-11-02 08:30:00' -> '08:30'
export function gio(v: string | null | undefined): string {
  if (!v) return '—'
  const t = v.length > 8 ? v.slice(11) : v
  return t.slice(0, 5)
}

export function ngayGio(v: string | null | undefined): string {
  if (!v) return '—'
  return `${ngay(v)} ${gio(v)}`
}

export function tuoi(ngaySinh: string | null): string {
  if (!ngaySinh) return ''
  const [y, m, d] = ngaySinh.split('-').map(Number)
  const [ny, nm, nd] = homNay().split('-').map(Number)
  return String(ny - y - (nm < m || (nm === m && nd < d) ? 1 : 0)) + ' tuổi'
}

// Khung 30 phút trong ngày: 08:00 … 19:30, Chủ nhật đến 16:30
export function khungTrongNgay(iso: string): string[] {
  const cuoi = thuTrongTuan(iso) === 7 ? 17 : 24
  return Array.from({ length: cuoi }, (_, i) => `${String(8 + Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`)
}

export function tenNgan(hoTen: string, vaiTro?: string): string {
  const ten = hoTen.trim().split(/\s+/).pop() ?? hoTen
  return vaiTro === 'bac_si' ? `BS ${ten}` : vaiTro === 'le_tan' ? `LT ${ten}` : vaiTro === 'quan_ly' ? `QL ${ten}` : ten
}

export const VAI_TRO: Record<string, string> = { bac_si: 'Bác sĩ', le_tan: 'Lễ tân', quan_ly: 'Quản lý' }

export const TRANG_THAI: Record<string, { nhan: string; cls: string }> = {
  da_dat: { nhan: 'Đã đặt', cls: 'bg-blue-50 border-blue-300 text-blue-900' },
  da_nhac: { nhan: 'Đã nhắc', cls: 'bg-emerald-50 border-emerald-300 text-emerald-900' },
  da_den: { nhan: 'Đã đến', cls: 'bg-amber-50 border-amber-300 text-amber-900' },
  hoan_thanh: { nhan: 'Hoàn thành', cls: 'bg-gray-100 border-gray-300 text-gray-700' },
  khong_den: { nhan: 'Không đến', cls: 'bg-rose-50 border-rose-300 text-rose-900' },
  da_huy: { nhan: 'Đã hủy', cls: 'bg-white border-rose-300 text-rose-700 line-through' },
}

// Danh mục lý do hủy nằm ở bảng ly_do_huy (quản lý sửa được ở màn Danh mục); đây chỉ là nhãn dự phòng.
export const LY_DO_HUY: Record<string, string> = {
  ban_viec: 'Bệnh nhân bận việc',
  om: 'Bệnh nhân ốm',
  quen_lich: 'Quên lịch / không liên lạc được',
  doi_y: 'Đổi ý, không làm nữa',
  chi_phi: 'Lo ngại chi phí',
  doi_lich: 'Dời sang lịch khác',
  bac_si_vang: 'Bác sĩ vắng',
  thiet_bi: 'Ghế / thiết bị hỏng',
  khac: 'Lý do khác',
}

export const BUOI: Record<string, string> = { sang: 'Sáng', chieu: 'Chiều' }

// Giờ ca chuẩn (G12): Chủ nhật đóng cửa 17h nên chia đôi khác ngày thường
export function gioCa(iso: string, buoi: string): [string, string] {
  const cn = thuTrongTuan(iso) === 7
  if (buoi === 'sang') return ['08:00', cn ? '12:30' : '14:00']
  return [cn ? '12:30' : '14:00', cn ? '17:00' : '20:00']
}

export const LOAI_LIEU_TRINH: Record<string, string> = { nieng_rang: 'Niềng răng', implant: 'Implant', khac: 'Khác' }

export const LOAI_GIAO_DICH: Record<string, string> = {
  nhap: 'Nhập',
  xuat_dung: 'Xuất dùng',
  xuat_ke_don: 'Xuất kê đơn',
  dieu_chinh: 'Điều chỉnh',
}

export function str(v: string | string[] | undefined): string {
  return Array.isArray(v) ? (v[0] ?? '') : (v ?? '')
}
