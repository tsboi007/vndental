import 'server-only'
import { refresh } from 'next/cache'
import { cookies } from 'next/headers'
import { notFound, redirect } from 'next/navigation'
import type { Trang } from '@/kieu/trang'
import type { ActionState } from './action'
import { COOKIE, luuPhien } from './session-cookie'

// Frontend không nối CSDL. Mọi dữ liệu lấy từ backend (BACKEND_URL), gọi server-to-server
// từ Server Component / Server Action, kèm token phiên trong header Authorization.
//   local:      BACKEND_URL=http://localhost:3001       (frontend/.env.local)
//   production: BACKEND_URL=https://bevndental.vercel.app (biến môi trường Vercel)
function backendUrl(): string {
  const url = process.env.BACKEND_URL
  if (!url) throw new Error('Thiếu BACKEND_URL (local: frontend/.env.local; production: biến môi trường Vercel).')
  return url.replace(/\/+$/, '')
}

export async function goiBackend(path: string, init: RequestInit = {}): Promise<Response> {
  const token = (await cookies()).get(COOKIE)?.value
  const headers = new Headers(init.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)
  return fetch(backendUrl() + path, { ...init, headers, cache: 'no-store' })
}

type ThamSo = Record<string, string | string[] | number | undefined | null>

function chuoiTruyVan(p: ThamSo): string {
  const sp = new URLSearchParams()
  for (const [k, v] of Object.entries(p)) {
    if (v === undefined || v === null) continue
    for (const x of Array.isArray(v) ? v : [v]) sp.append(k, String(x))
  }
  const s = sp.toString()
  return s ? `?${s}` : ''
}

function xuLyLoiQuyen(status: number): void {
  if (status === 401) redirect('/dang-nhap')
  if (status === 403) redirect('/khong-quyen')
}

// Dữ liệu cho một màn hình: GET /api/trang/<ten>. Kiểu trả về lấy từ src/kieu/trang.ts,
// sinh từ backend/src/trang/<ten>.ts bằng `npm run sinh-kieu` (trong thư mục backend).
export async function trang<K extends keyof Trang>(ten: K, thamSo: ThamSo = {}): Promise<Trang[K]> {
  const res = await goiBackend(`/api/trang/${ten}${chuoiTruyVan(thamSo)}`)
  xuLyLoiQuyen(res.status)
  if (res.status === 404) notFound()
  if (!res.ok) throw new Error(`Backend lỗi ${res.status} khi tải trang ${ten}.`)
  return res.json() as Promise<Trang[K]>
}

// Lệnh ghi: POST /api/lenh/<ten> với nguyên FormData của form. Gọi từ Server Action.
export async function lenh(ten: string, fd: FormData): Promise<ActionState> {
  const res = await goiBackend(`/api/lenh/${ten}`, { method: 'POST', body: fd })
  xuLyLoiQuyen(res.status)
  if (!res.ok) return { error: `Không gửi được thao tác (backend ${res.status}).`, at: Date.now() }
  const kq = (await res.json()) as { ok?: string; error?: string; at?: number; token?: string; redirect?: string }
  if (kq.token) await luuPhien(kq.token)
  if (kq.redirect) redirect(kq.redirect)
  if (kq.ok) refresh()
  return { ok: kq.ok, error: kq.error, at: kq.at ?? Date.now() }
}
