import 'server-only'
import { createHmac, timingSafeEqual } from 'node:crypto'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { q1 } from './db'

export type VaiTro = 'bac_si' | 'le_tan' | 'quan_ly'

export type NhanVien = {
  id: number
  ho_ten: string
  vai_tro: VaiTro
  ban_thoi_gian: boolean
}

export const COOKIE = 'nv'
const THOI_HAN = 60 * 60 * 12 // 12 giờ, đúng một ngày làm việc

// Cookie phiên: "<id>.<hết hạn>.<chữ ký>". Chữ ký = HMAC-SHA256(SESSION_SECRET, id.hết hạn.mat_khau_hash)
// → không sửa tay được id; đổi / đặt lại mật khẩu thì mọi phiên cũ của người đó tự hết hiệu lực.
// scripts/smoke.ps1 tạo cookie theo đúng công thức này.
function secret(): string {
  const s = process.env.SESSION_SECRET
  if (!s || s.length < 32) throw new Error('Thiếu SESSION_SECRET (≥ 32 ký tự) — local: .env.local; production: biến môi trường Vercel.')
  return s
}

function kyTen(id: number, het: number, matKhauHash: string): string {
  return createHmac('sha256', secret()).update(`${id}.${het}.${matKhauHash}`).digest('base64url')
}

export async function taoPhien(nv: { id: number; vai_tro: VaiTro; mat_khau_hash: string }): Promise<void> {
  const het = Math.floor(Date.now() / 1000) + THOI_HAN
  const jar = await cookies()
  const opt = { httpOnly: true, sameSite: 'lax' as const, path: '/', maxAge: THOI_HAN, secure: process.env.NODE_ENV === 'production' }
  jar.set(COOKIE, `${nv.id}.${het}.${kyTen(nv.id, het, nv.mat_khau_hash)}`, opt)
  jar.set('vt', nv.vai_tro, opt) // chỉ để proxy.ts chọn trang chủ; quyền thật lấy từ CSDL
}

export async function getNhanVien(): Promise<NhanVien | null> {
  const [idStr, hetStr, chuKy] = ((await cookies()).get(COOKIE)?.value ?? '').split('.')
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

// Quản lý có toàn quyền (giả định G7). Không truyền vai trò = chỉ cần đăng nhập.
export async function requireNhanVien(...roles: VaiTro[]): Promise<NhanVien> {
  const nv = await getNhanVien()
  if (!nv) redirect('/dang-nhap')
  if (roles.length && nv.vai_tro !== 'quan_ly' && !roles.includes(nv.vai_tro)) {
    // Không ném lỗi: ở production Next ẩn nội dung lỗi phía server, người dùng chỉ thấy mã lỗi khó hiểu.
    redirect('/khong-quyen')
  }
  return nv
}

export function homeOf(vaiTro: VaiTro): string {
  return vaiTro === 'bac_si' ? '/phieu-dieu-tri' : vaiTro === 'quan_ly' ? '/bao-cao' : '/lich-hen'
}
