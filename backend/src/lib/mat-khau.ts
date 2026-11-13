import 'server-only'
import { randomBytes, randomInt, scrypt, timingSafeEqual, type ScryptOptions } from 'node:crypto'

// Băm mật khẩu bằng scrypt (có sẵn trong Node, không cần thư viện ngoài).
// Định dạng lưu ở nhan_vien.mat_khau_hash:  scrypt$N$r$p$<salt base64>$<hash base64>
// scripts/dat-mat-khau.mjs và scripts/e2e.py dùng đúng định dạng này.
const N = 16384, R = 8, P = 1, LEN = 32

function scryptAsync(pw: string, salt: Buffer, len: number, opt: ScryptOptions): Promise<Buffer> {
  return new Promise((ok, fail) => scrypt(pw.normalize('NFC'), salt, len, opt, (e, k) => (e ? fail(e) : ok(k))))
}

export async function bamMatKhau(pw: string): Promise<string> {
  const salt = randomBytes(16)
  const h = await scryptAsync(pw, salt, LEN, { N, r: R, p: P })
  return `scrypt$${N}$${R}$${P}$${salt.toString('base64')}$${h.toString('base64')}`
}

// Hash giả để khi sai tên đăng nhập vẫn tốn thời gian như sai mật khẩu (không lộ tên nào tồn tại).
const HASH_GIA = `scrypt$${N}$${R}$${P}$${Buffer.alloc(16).toString('base64')}$${Buffer.alloc(LEN).toString('base64')}`

export async function kiemTraMatKhau(pw: string, luu: string | null | undefined): Promise<boolean> {
  const [alg, n, r, p, salt, hash] = (luu || HASH_GIA).split('$')
  if (alg !== 'scrypt' || !salt || !hash) return false
  const mong = Buffer.from(hash, 'base64')
  const tinh = await scryptAsync(pw, Buffer.from(salt, 'base64'), mong.length, { N: +n, r: +r, p: +p, maxmem: 64 * 1024 * 1024 })
  return timingSafeEqual(tinh, mong) && !!luu
}

export const MAT_KHAU_TOI_THIEU = 8

// Mật khẩu tạm dễ đọc (bỏ ký tự dễ nhầm 0/O, 1/l/I), dùng khi thêm nhân viên / đặt lại mật khẩu.
export function matKhauTam(dai = 12): string {
  const ky = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  return Array.from({ length: dai }, () => ky[randomInt(ky.length)]).join('')
}
