'use server'

import { lenh } from '@/lib/api'
import type { ActionState } from '@/lib/action'

// Chỉ chuyển form sang backend: POST /api/lenh/<tên> (xử lý thật ở backend/src/lenh/phieu-dieu-tri.ts).

export async function batDauKham(_: ActionState, fd: FormData): Promise<ActionState> {
  return lenh('batDauKham', fd)
}

export async function khamVangLai(_: ActionState, fd: FormData): Promise<ActionState> {
  return lenh('khamVangLai', fd)
}

export async function luuChanDoan(_: ActionState, fd: FormData): Promise<ActionState> {
  return lenh('luuChanDoan', fd)
}

export async function themViec(_: ActionState, fd: FormData): Promise<ActionState> {
  return lenh('themViec', fd)
}

export async function xoaViec(_: ActionState, fd: FormData): Promise<ActionState> {
  return lenh('xoaViec', fd)
}

export async function keThuoc(_: ActionState, fd: FormData): Promise<ActionState> {
  return lenh('keThuoc', fd)
}

export async function hoanThuoc(_: ActionState, fd: FormData): Promise<ActionState> {
  return lenh('hoanThuoc', fd)
}

export async function ghiVatTu(_: ActionState, fd: FormData): Promise<ActionState> {
  return lenh('ghiVatTu', fd)
}

export async function hoanTat(_: ActionState, fd: FormData): Promise<ActionState> {
  return lenh('hoanTat', fd)
}
