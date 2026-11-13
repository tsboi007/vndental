import type { NextRequest } from 'next/server'
import { xuLy } from '@/lib/api'
import { q1 } from '@/lib/db'
import { requireNhanVien } from '@/lib/session'

// GET -> nhân viên của token hiện tại + số vật tư sắp hết (huy hiệu trên menu Kho).
// 401 nếu token sai / hết hạn / người đó đã nghỉ việc.
export async function GET(req: NextRequest) {
  return xuLy(req, async () => {
    const nv = await requireNhanVien()
    const sapHet = await q1<{ n: number }>('SELECT count(*) AS n FROM v_vat_tu_sap_het')
    return { ...nv, vat_tu_sap_het: sapHet?.n ?? 0 }
  })
}
