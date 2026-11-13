'use server'

import { lenh } from '@/lib/api'
import type { ActionState } from '@/lib/action'

// Chỉ chuyển form sang backend: POST /api/lenh/<tên> (xử lý thật ở backend/src/lenh/ca-truc.ts).

export async function themCa(_: ActionState, fd: FormData): Promise<ActionState> {
  return lenh('themCa', fd)
}

export async function xoaCa(_: ActionState, fd: FormData): Promise<ActionState> {
  return lenh('xoaCa', fd)
}

export async function saoChepTuanTruoc(_: ActionState, fd: FormData): Promise<ActionState> {
  return lenh('saoChepTuanTruoc', fd)
}
