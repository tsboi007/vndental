'use server'

import { redirect } from 'next/navigation'
import type { ActionState } from '@/lib/action'
import { goiBackend } from '@/lib/api'
import { luuPhien, xoaPhien } from '@/lib/session-cookie'

// Đăng nhập: backend kiểm mật khẩu (POST /api/dang-nhap) và cấp token; frontend cất token vào cookie httpOnly.
export async function dangNhap(_: ActionState, fd: FormData): Promise<ActionState> {
  const res = await goiBackend('/api/dang-nhap', { method: 'POST', body: fd })
  if (!res.ok) return { error: `Không kết nối được máy chủ (backend ${res.status}).`, at: Date.now() }
  const kq = (await res.json()) as { error?: string; token?: string; vai_tro?: string; home?: string; max_age?: number }
  if (!kq.token) return { error: kq.error ?? 'Sai tên đăng nhập hoặc mật khẩu.', at: Date.now() }
  await luuPhien(kq.token, kq.vai_tro, kq.max_age)
  redirect(kq.home ?? '/')
}

export async function dangXuat() {
  await xoaPhien()
  redirect('/dang-nhap')
}
