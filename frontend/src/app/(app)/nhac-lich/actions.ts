'use server'

import { lenh } from '@/lib/api'
import type { ActionState } from '@/lib/action'

// Chỉ chuyển form sang backend: POST /api/lenh/<tên> (xử lý thật ở backend/src/lenh/nhac-lich.ts).

export async function ghiNhac(_: ActionState, fd: FormData): Promise<ActionState> {
  return lenh('ghiNhac', fd)
}

export async function guiTinHangLoat(_: ActionState, fd: FormData): Promise<ActionState> {
  return lenh('guiTinHangLoat', fd)
}
