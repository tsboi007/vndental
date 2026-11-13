import 'server-only'
import { AsyncLocalStorage } from 'node:async_hooks'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { q1 } from './db'
import { LoiApi } from './ket-qua'

export type VaiTro = 'bac_si' | 'le_tan' | 'quan_ly'

export type NhanVien = {
  id: number
  ho_ten: string
  vai_tro: VaiTro
  ban_thoi_gian: boolean
}

export const THOI_HAN = 60 * 60 * 12 // 12 giờ, đúng một ngày làm việc

// Token phiên: "<id>.<hết hạn>.<chữ ký>", chữ ký = HMAC-SHA256(SESSION_SECRET, id.hết hạn.mat_khau_hash).
// Frontend giữ token trong cookie httpOnly và gửi lại ở header Authorization: Bearer <token>.
// Không sửa tay được id; đổi / đặt lại mật khẩu thì mọi token cũ của người đó tự hết hiệu lực.
function secret(): string {
  const s = process.env.SESSION_SECRET
  if (!s || s.length < 32) throw new Error('Thiếu SESSION_SECRET (≥ 32 ký tự) — local: backend/.env.local; production: biến môi trường Vercel.')
  return s
}

function kyTen(id: number, het: number, matKhauHash: string): string {
  return createHmac('sha256', secret()).update(`${id}.${het}.${matKhauHash}`).digest('base64url')
}

export function taoToken(nv: { id: number; mat_khau_hash: string }): string {
  const het = Math.floor(Date.now() / 1000) + THOI_HAN
  return `${nv.id}.${het}.${kyTen(nv.id, het, nv.mat_khau_hash)}`
}

export async function xacThucToken(token: string | null | undefined): Promise<NhanVien | null> {
  const [idStr, hetStr, chuKy] = (token ?? '').split('.')
  const id = Number(idStr), het = Number(hetStr)
  if (!Number.isInteger(id) || id <= 0 || !het || !chuKy || het < Date.now() / 1000) return null
  const nv = await q1<NhanVien & { mat_khau_hash: string | null }>(
    'SELECT id, ho_ten, vai_tro, ban_thoi_gian, mat_khau_hash FROM nhan_vien WHERE id = $1 AND dang_lam_viec',
    [id],
  )
  if (!nv?.mat_khau_hash) return null
  const dung = Buffer.from(kyTen(id, het, nv.mat_khau_hash))
  const gui = Buffer.from(chuKy)
  if (dung.length !== gui.length || !timingSafeEqual(dung, gui)) return null
  return { id: nv.id, ho_ten: nv.ho_ten, vai_tro: nv.vai_tro, ban_thoi_gian: nv.ban_thoi_gian }
}

// Nhân viên của request đang xử lý (đặt bởi lib/api.ts sau khi kiểm token).
const hienTai = new AsyncLocalStorage<NhanVien | null>()

export function chayVoi<T>(nv: NhanVien | null, fn: () => Promise<T>): Promise<T> {
  return hienTai.run(nv, fn)
}

export async function getNhanVien(): Promise<NhanVien | null> {
  return hienTai.getStore() ?? null
}

// Quản lý có toàn quyền (giả định G7). Không truyền vai trò = chỉ cần đăng nhập.
export async function requireNhanVien(...roles: VaiTro[]): Promise<NhanVien> {
  const nv = hienTai.getStore()
  if (!nv) throw new LoiApi(401, 'Chưa đăng nhập.')
  if (roles.length && nv.vai_tro !== 'quan_ly' && !roles.includes(nv.vai_tro)) throw new LoiApi(403, 'Không có quyền.')
  return nv
}

export function homeOf(vaiTro: VaiTro): string {
  return vaiTro === 'bac_si' ? '/phieu-dieu-tri' : vaiTro === 'quan_ly' ? '/bao-cao' : '/lich-hen'
}
