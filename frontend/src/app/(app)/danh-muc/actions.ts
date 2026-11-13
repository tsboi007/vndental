'use server'

import { lenh } from '@/lib/api'
import type { ActionState } from '@/lib/action'

// Chỉ chuyển form sang backend: POST /api/lenh/<tên> (xử lý thật ở backend/src/lenh/danh-muc.ts).

export async function themNhanVien(_: ActionState, fd: FormData): Promise<ActionState> {
  return lenh('themNhanVien', fd)
}

export async function datLaiMatKhau(_: ActionState, fd: FormData): Promise<ActionState> {
  return lenh('datLaiMatKhau', fd)
}

export async function doiTrangThaiNhanVien(_: ActionState, fd: FormData): Promise<ActionState> {
  return lenh('doiTrangThaiNhanVien', fd)
}

export async function themDichVu(_: ActionState, fd: FormData): Promise<ActionState> {
  return lenh('themDichVu', fd)
}

export async function batTatDichVu(_: ActionState, fd: FormData): Promise<ActionState> {
  return lenh('batTatDichVu', fd)
}

export async function themGhe(_: ActionState, fd: FormData): Promise<ActionState> {
  return lenh('themGhe', fd)
}

export async function batTatGhe(_: ActionState, fd: FormData): Promise<ActionState> {
  return lenh('batTatGhe', fd)
}

export async function themLyDo(_: ActionState, fd: FormData): Promise<ActionState> {
  return lenh('themLyDo', fd)
}

export async function batTatLyDo(_: ActionState, fd: FormData): Promise<ActionState> {
  return lenh('batTatLyDo', fd)
}
