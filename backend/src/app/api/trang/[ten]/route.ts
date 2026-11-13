import type { NextRequest } from 'next/server'
import { thamSo, xuLy } from '@/lib/api'
import { LoiApi } from '@/lib/ket-qua'
import { TRANG } from '@/trang'

// GET ?<tham số của trang> -> dữ liệu để frontend dựng màn hình <tên>.
export async function GET(req: NextRequest, ctx: RouteContext<'/api/trang/[ten]'>) {
  const { ten } = await ctx.params
  return xuLy(req, async () => {
    const tai = Object.hasOwn(TRANG, ten) ? TRANG[ten] : undefined
    if (!tai) throw new LoiApi(404, `Không có trang ${ten}.`)
    return tai(thamSo(req))
  })
}
