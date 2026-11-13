'use server'

import { lenh } from '@/lib/api'
import type { ActionState } from '@/lib/action'

// Chỉ chuyển form sang backend: POST /api/lenh/<tên> (xử lý thật ở backend/src/lenh/doi-mat-khau.ts).

export async function doiMatKhau(_: ActionState, fd: FormData): Promise<ActionState> {
  return lenh('doiMatKhau', fd)
}
