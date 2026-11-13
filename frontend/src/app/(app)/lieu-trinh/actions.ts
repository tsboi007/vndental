'use server'

import { lenh } from '@/lib/api'
import type { ActionState } from '@/lib/action'

// Chỉ chuyển form sang backend: POST /api/lenh/<tên> (xử lý thật ở backend/src/lenh/lieu-trinh.ts).

export async function moLieuTrinh(_: ActionState, fd: FormData): Promise<ActionState> {
  return lenh('moLieuTrinh', fd)
}

export async function capNhatLieuTrinh(_: ActionState, fd: FormData): Promise<ActionState> {
  return lenh('capNhatLieuTrinh', fd)
}

export async function themDot(_: ActionState, fd: FormData): Promise<ActionState> {
  return lenh('themDot', fd)
}

export async function suaDot(_: ActionState, fd: FormData): Promise<ActionState> {
  return lenh('suaDot', fd)
}
