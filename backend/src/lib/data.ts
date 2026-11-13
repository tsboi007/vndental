import 'server-only'
import { q } from './db'

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

// Tìm theo SĐT (bỏ khoảng trắng / dấu chấm), mã hồ sơ, mã hồ sơ giấy hoặc một phần họ tên (L1).
export async function timBenhNhan(text: string, limit = 50): Promise<BenhNhan[]> {
  const t = text.trim()
  if (!t) return []
  const so = chiSo(t)
  if (so.length >= 3 && so.length === t.replace(/[\s.]/g, '').length) {
    return q<BenhNhan>(`SELECT * FROM benh_nhan WHERE sdt LIKE $1 || '%' ORDER BY ho_ten LIMIT $2`, [so, limit])
  }
  return q<BenhNhan>(
    `SELECT * FROM benh_nhan
     WHERE ma_ho_so ILIKE $1 OR ma_ho_so_giay ILIKE $1 OR ho_ten ILIKE '%' || $1 || '%'
     ORDER BY ho_ten LIMIT $2`,
    [t, limit],
  )
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

export async function caTrucNgay(ngay: string, chiBacSi = true): Promise<CaTruc[]> {
  return q<CaTruc>(
    `SELECT ct.id, ct.nhan_vien_id, nv.ho_ten, nv.vai_tro, nv.ban_thoi_gian, ct.ngay, ct.buoi, ct.gio_bat_dau, ct.gio_ket_thuc
     FROM ca_truc ct JOIN nhan_vien nv ON nv.id = ct.nhan_vien_id
     WHERE ct.ngay = $1 ${chiBacSi ? "AND nv.vai_tro = 'bac_si'" : ''}
     ORDER BY nv.vai_tro, nv.id, ct.gio_bat_dau`,
    [ngay],
  )
}

// Khung 'HH:MM' (30 phút) có nằm trọn trong ca không (L11)
export function trongCa(ca: { gio_bat_dau: string; gio_ket_thuc: string }, khung: string): boolean {
  const [h, m] = khung.split(':').map(Number)
  const ket = `${String(h + (m === 30 ? 1 : 0)).padStart(2, '0')}:${m === 30 ? '00' : '30'}`
  return ca.gio_bat_dau.slice(0, 5) <= khung && ca.gio_ket_thuc.slice(0, 5) >= ket
}

export type DichVu = { id: number; ma: string; ten: string; nhom: string | null; don_vi: string; theo_rang: boolean; dang_ap_dung: boolean }

export async function dsDichVu(tatCa = false): Promise<DichVu[]> {
  return q<DichVu>(`SELECT * FROM dich_vu ${tatCa ? '' : 'WHERE dang_ap_dung'} ORDER BY id`)
}

export async function dsBacSi(): Promise<{ id: number; ho_ten: string; vai_tro: string }[]> {
  return q("SELECT id, ho_ten, vai_tro FROM nhan_vien WHERE vai_tro = 'bac_si' AND dang_lam_viec ORDER BY id")
}

export async function dsGhe(): Promise<{ id: number; ten: string; dang_hoat_dong: boolean }[]> {
  return q('SELECT id, ten, dang_hoat_dong FROM ghe ORDER BY id')
}

export async function dsLyDoHuy(): Promise<{ ma: string; ten: string }[]> {
  return q('SELECT ma, ten FROM ly_do_huy WHERE dang_dung ORDER BY ten')
}
