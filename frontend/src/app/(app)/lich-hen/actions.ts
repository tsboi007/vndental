'use server'

import { lenh } from '@/lib/api'
import type { ActionState } from '@/lib/action'

// Chỉ chuyển form sang backend: POST /api/lenh/<tên> (xử lý thật ở backend/src/lenh/lich-hen.ts).

export async function datLich(_: ActionState, fd: FormData): Promise<ActionState> {
  return lenh('datLich', fd)
}

export async function doiTrangThai(_: ActionState, fd: FormData): Promise<ActionState> {
  return lenh('doiTrangThai', fd)
}

export async function huyLich(_: ActionState, fd: FormData): Promise<ActionState> {
  return lenh('huyLich', fd)
}

export async function taoBenhNhan(_: ActionState, fd: FormData): Promise<ActionState> {
  return lenh('taoBenhNhan', fd)
}
