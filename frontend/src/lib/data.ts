// Kiểu dữ liệu và hàm thuần dùng ở giao diện (truy vấn nằm ở backend/src/lib/data.ts).

export type BenhNhan = {
  id: number
  ma_ho_so: string
  ma_ho_so_giay: string | null
  ho_ten: string
  ngay_sinh: string | null
  gioi_tinh: string | null
  sdt: string
  sdt_la_cua: string | null
  ten_nguoi_giam_ho: string | null
  dia_chi: string | null
  di_ung: string | null
  tien_su_benh: string | null
  tao_luc: string
}

export function chiSo(s: string): string {
  return s.replace(/\D/g, '')
}

// '0909000111' -> '0909 000 111'
export function sdtDep(s: string | null | undefined): string {
  if (!s) return '—'
  return s.length === 10 ? `${s.slice(0, 4)} ${s.slice(4, 7)} ${s.slice(7)}` : s
}

export type CaTruc = {
  id: number
  nhan_vien_id: number
  ho_ten: string
  vai_tro: string
  ban_thoi_gian: boolean
  ngay: string
  buoi: string
  gio_bat_dau: string
  gio_ket_thuc: string
}

// Khung 'HH:MM' (30 phút) có nằm trọn trong ca không (L11)
export function trongCa(ca: { gio_bat_dau: string; gio_ket_thuc: string }, khung: string): boolean {
  const [h, m] = khung.split(':').map(Number)
  const ket = `${String(h + (m === 30 ? 1 : 0)).padStart(2, '0')}:${m === 30 ? '00' : '30'}`
  return ca.gio_bat_dau.slice(0, 5) <= khung && ca.gio_ket_thuc.slice(0, 5) >= ket
}

export type DichVu = { id: number; ma: string; ten: string; nhom: string | null; don_vi: string; theo_rang: boolean; dang_ap_dung: boolean }
