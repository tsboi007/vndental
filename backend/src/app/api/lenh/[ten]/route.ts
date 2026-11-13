import type { NextRequest } from 'next/server'
import { xuLy } from '@/lib/api'
import { LoiApi } from '@/lib/ket-qua'
import { LENH } from '@/lenh'

// POST multipart/form-data -> { ok, at, token? } | { error, at } | { redirect }.
export async function POST(req: NextRequest, ctx: RouteContext<'/api/lenh/[ten]'>) {
  const { ten } = await ctx.params
  return xuLy(req, async () => {
    const lenh = Object.hasOwn(LENH, ten) ? LENH[ten] : undefined
    if (!lenh) throw new LoiApi(404, `Không có lệnh ${ten}.`)
    return lenh(undefined, await req.formData())
  })
}
