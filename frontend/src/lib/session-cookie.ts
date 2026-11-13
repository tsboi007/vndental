import 'server-only'
import { cookies } from 'next/headers'

// Cookie trên tên miền frontend:
//   nv = token phiên do backend cấp ("<id>.<hết hạn>.<chữ ký HMAC>") — frontend không đọc được nội dung, chỉ chuyển tiếp
//   vt = vai trò, chỉ để proxy.ts chọn trang chủ; quyền thật do backend kiểm
export const COOKIE = 'nv'
const THOI_HAN = 60 * 60 * 12

function opt(maxAge: number) {
  return { httpOnly: true, sameSite: 'lax' as const, path: '/', maxAge, secure: process.env.NODE_ENV === 'production' }
}

export async function luuPhien(token: string, vaiTro?: string, maxAge = THOI_HAN): Promise<void> {
  const jar = await cookies()
  jar.set(COOKIE, token, opt(maxAge))
  if (vaiTro) jar.set('vt', vaiTro, opt(maxAge))
}

export async function xoaPhien(): Promise<void> {
  const jar = await cookies()
  jar.delete(COOKIE)
  jar.delete('vt')
}
