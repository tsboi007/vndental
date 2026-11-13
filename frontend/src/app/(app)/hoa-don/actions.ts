'use server'

import { lenh } from '@/lib/api'
import type { ActionState } from '@/lib/action'

// Chỉ chuyển form sang backend: POST /api/lenh/<tên> (xử lý thật ở backend/src/lenh/hoa-don.ts).

export async function lapHoaDon(_: ActionState, fd: FormData): Promise<ActionState> {
  return lenh('lapHoaDon', fd)
}

export async function suaGiamGia(_: ActionState, fd: FormData): Promise<ActionState> {
  return lenh('suaGiamGia', fd)
}

export async function xoaDong(_: ActionState, fd: FormData): Promise<ActionState> {
  return lenh('xoaDong', fd)
}

export async function themDong(_: ActionState, fd: FormData): Promise<ActionState> {
  return lenh('themDong', fd)
}

export async function giamGiaTong(_: ActionState, fd: FormData): Promise<ActionState> {
  return lenh('giamGiaTong', fd)
}

export async function thuTien(_: ActionState, fd: FormData): Promise<ActionState> {
  return lenh('thuTien', fd)
}
