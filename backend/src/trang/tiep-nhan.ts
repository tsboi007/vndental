import type { SP } from '@/lib/api'
import { q } from '@/lib/db'
import { homNay, str } from '@/lib/format'
import { timBenhNhan, caTrucNgay } from '@/lib/data'
import { requireNhanVien } from '@/lib/session'

type LichHom = { id: number; gio_bat_dau: string; trang_thai: string; benh_nhan_id: number; ho_ten: string; bac_si: string; ghe: string; viec: string | null }

export async function tiepNhan(sp: SP) {
  await requireNhanVien('le_tan')
  const tim = str(sp.sdt)
  const chon = Number(str(sp.bn)) || 0
  const loc = str(sp.loc) || 'cho'
  const hom = homNay()

  const lich = await q<LichHom>(
    `SELECT lh.id, lh.gio_bat_dau, lh.trang_thai, lh.benh_nhan_id, bn.ho_ten, bs.ho_ten AS bac_si, g.ten AS ghe, dv.ten AS viec
     FROM lich_hen lh JOIN benh_nhan bn ON bn.id = lh.benh_nhan_id JOIN nhan_vien bs ON bs.id = lh.bac_si_id
     JOIN ghe g ON g.id = lh.ghe_id LEFT JOIN dich_vu dv ON dv.id = lh.dich_vu_id
     WHERE lh.ngay = $1 AND lh.trang_thai <> 'da_huy' ORDER BY lh.gio_bat_dau, g.id`,
    [hom],
  )
  const nhom = { cho: ['da_dat', 'da_nhac'], den: ['da_den'], xong: ['hoan_thanh', 'khong_den'] } as Record<string, string[]>
  const hien = loc === 'tat_ca' ? lich : lich.filter((l) => nhom[loc]?.includes(l.trang_thai))
  const ketQua = tim ? await timBenhNhan(tim, 10) : []
  const bnId = chon || (ketQua.find((b) => lich.some((l) => l.benh_nhan_id === b.id && ['da_dat', 'da_nhac'].includes(l.trang_thai)))?.id ?? ketQua[0]?.id)
  const bn = ketQua.find((b) => b.id === bnId)
  const lichBn = bn ? lich.filter((l) => l.benh_nhan_id === bn.id) : []
  const tomTat = bn
    ? (await q<{ con_no: number; lieu_trinh: string | null }>(
        `SELECT (SELECT coalesce(sum(con_no), 0) FROM v_cong_no_hoa_don WHERE benh_nhan_id = $1) AS con_no,
                (SELECT string_agg(ten || ' (' || so_buoi_da_lam || '/' || tong_so_buoi || ')', ', ') FROM v_lieu_trinh_dang_do WHERE benh_nhan_id = $1) AS lieu_trinh`,
        [bn.id],
      ))[0]
    : undefined
  const ca = await caTrucNgay(hom)
  const ghe = await q<{ id: number; ten: string }>('SELECT id, ten FROM ghe WHERE dang_hoat_dong ORDER BY id')
  return { tim, chon, loc, hom, lich, nhom, hien, ketQua, bnId, bn, lichBn, tomTat, ca, ghe }
}
