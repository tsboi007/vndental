import 'server-only'
import { NextResponse, type NextRequest } from 'next/server'
import { ChuyenTrang, LoiApi } from './ket-qua'
import { chayVoi, xacThucToken } from './session'

// Bọc mọi API: đọc token (Authorization: Bearer), đặt nhân viên hiện tại cho requireNhanVien,
// đổi tín hiệu thành JSON: LoiApi -> mã HTTP; ChuyenTrang -> { redirect }; lỗi khác -> 500.
export async function xuLy(req: NextRequest, fn: () => Promise<unknown>): Promise<NextResponse> {
  const auth = req.headers.get('authorization') ?? ''
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null
  try {
    const nv = token ? await xacThucToken(token) : null
    const data = await chayVoi(nv, fn)
    return NextResponse.json(data ?? null, { headers: { 'Cache-Control': 'no-store' } })
  } catch (e) {
    if (e instanceof ChuyenTrang) return NextResponse.json({ redirect: e.url }, { headers: { 'Cache-Control': 'no-store' } })
    if (e instanceof LoiApi) return NextResponse.json({ error: e.message }, { status: e.status })
    console.error(e)
    return NextResponse.json({ error: 'Lỗi máy chủ.' }, { status: 500 })
  }
}

// Tham số của một màn hình (searchParams + params của route), dạng giống searchParams của trang Next.
export type SP = Record<string, string | string[] | undefined>

// Query string -> SP (khóa lặp lại thành mảng).
export function thamSo(req: NextRequest): SP {
  const out: Record<string, string | string[]> = {}
  for (const [k, v] of req.nextUrl.searchParams) {
    const cu = out[k]
    out[k] = cu === undefined ? v : Array.isArray(cu) ? [...cu, v] : [cu, v]
  }
  return out
}
