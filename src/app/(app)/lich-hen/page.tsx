import { Suspense } from 'react'
import { Skeleton } from '@/components/Skeleton'
import Link from 'next/link'
import { PageTitle, Card } from '@/components/ui'
import { q } from '@/lib/db'
import { caTrucNgay, trongCa } from '@/lib/data'
import { congNgay, homNay, khungTrongNgay, ngayDayDu, str, tenNgan, TRANG_THAI, gio } from '@/lib/format'
import { requireNhanVien } from '@/lib/session'

export const metadata = { title: 'Lịch hẹn' }

type Lich = {
  id: number
  ghe_id: number
  gio_bat_dau: string
  trang_thai: string
  bac_si_id: number
  bac_si: string
  benh_nhan: string
  viec: string | null
  noi_dung: string | null
}

async function LichHenPage({ searchParams }: PageProps<'/lich-hen'>) {
  await requireNhanVien('le_tan', 'bac_si')
  const sp = await searchParams
  const ngay = str(sp.ngay) || homNay()
  const loc = Number(str(sp.bs)) || 0

  const [lich, ca, ghe, huy] = await Promise.all([
    q<Lich>(
      `SELECT lh.id, lh.ghe_id, lh.gio_bat_dau, lh.trang_thai, lh.bac_si_id, bs.ho_ten AS bac_si,
              bn.ho_ten AS benh_nhan, dv.ten AS viec, lh.noi_dung
       FROM lich_hen lh
       JOIN benh_nhan bn ON bn.id = lh.benh_nhan_id
       JOIN nhan_vien bs ON bs.id = lh.bac_si_id
       LEFT JOIN dich_vu dv ON dv.id = lh.dich_vu_id
       WHERE lh.ngay = $1 AND lh.trang_thai <> 'da_huy'`,
      [ngay],
    ),
    caTrucNgay(ngay),
    q<{ id: number; ten: string }>('SELECT id, ten FROM ghe WHERE dang_hoat_dong ORDER BY id'),
    q<{ n: number }>("SELECT count(*) AS n FROM lich_hen WHERE ngay = $1 AND trang_thai = 'da_huy'", [ngay]),
  ])

  const khung = khungTrongNgay(ngay)
  const theoO = new Map(lich.map((l) => [`${gio(l.gio_bat_dau)}|${l.ghe_id}`, l]))
  const bacSi = [...new Map(ca.map((c) => [c.nhan_vien_id, c.ho_ten])).entries()]
  const coBacSi = (k: string) => ca.some((c) => trongCa(c, k) && (!loc || c.nhan_vien_id === loc))
  const ban = (bsId: number, k: string) => lich.some((l) => l.bac_si_id === bsId && gio(l.gio_bat_dau) === k)
  const conTrong = (bsId: number) =>
    khung.filter((k) => ca.some((c) => c.nhan_vien_id === bsId && trongCa(c, k)) && !ban(bsId, k)).length
  const q_ = (o: Record<string, string | number>) => '?' + new URLSearchParams({ ngay, ...(loc ? { bs: String(loc) } : {}), ...Object.fromEntries(Object.entries(o).map(([k, v]) => [k, String(v)])) })

  return (
    <>
      <PageTitle title="Lịch hẹn" sub={`${ngayDayDu(ngay)} · ${lich.length}/${khung.length * ghe.length} khung đã đặt · ${huy[0].n} lịch hủy`}>
        <Link className="btn-sec" href={q_({ ngay: congNgay(ngay, -1) })}>‹</Link>
        <form className="flex gap-2">
          <input type="date" name="ngay" defaultValue={ngay} className="input w-40" />
          <select name="bs" defaultValue={loc || ''} className="input w-44">
            <option value="">Tất cả bác sĩ</option>
            {bacSi.map(([id, ten]) => (
              <option key={id} value={id}>{tenNgan(ten, 'bac_si')}</option>
            ))}
          </select>
          <button className="btn-sec">Xem</button>
        </form>
        <Link className="btn-sec" href={q_({ ngay: congNgay(ngay, 1) })}>›</Link>
        <Link className="btn-sec" href="/lich-hen">Hôm nay</Link>
        <Link className="btn-primary" href={`/lich-hen/dat?ngay=${ngay}${loc ? `&bs=${loc}` : ''}`}>+ Đặt lịch hẹn</Link>
      </PageTitle>

      <div className="mb-3 flex flex-wrap gap-2 text-xs">
        {['da_dat', 'da_nhac', 'da_den', 'hoan_thanh', 'khong_den'].map((t) => (
          <span key={t} className={`chip ${TRANG_THAI[t].cls}`}>{TRANG_THAI[t].nhan}</span>
        ))}
        <span className="chip border-dashed border-gray-300 bg-gray-100 text-gray-500">Không có bác sĩ trực</span>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_240px]">
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[720px] table-fixed border-collapse text-xs">
            <thead>
              <tr>
                <th className="w-16 border-b border-gray-200 bg-gray-50 py-2 font-semibold text-gray-600">Giờ</th>
                {ghe.map((g) => (
                  <th key={g.id} className="border-b border-l border-gray-200 bg-gray-50 py-2 font-semibold text-gray-600">{g.ten}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {khung.map((k) => {
                const co = coBacSi(k)
                return (
                  <tr key={k}>
                    <td className="border-b border-gray-100 text-center text-gray-500 tabular-nums">{k}</td>
                    {ghe.map((g) => {
                      const l = theoO.get(`${k}|${g.id}`)
                      if (l) {
                        const mo = loc && l.bac_si_id !== loc
                        return (
                          <td key={g.id} className="h-8 border-b border-l border-gray-100 p-0.5">
                            <Link
                              href={`/lich-hen/${l.id}`}
                              className={`block truncate rounded border px-2 py-1 ${TRANG_THAI[l.trang_thai].cls} ${mo ? 'opacity-35' : ''} hover:ring-2 hover:ring-brand/30`}
                              title={`${l.benh_nhan} · ${l.viec ?? l.noi_dung ?? ''} · ${tenNgan(l.bac_si, 'bac_si')}`}
                            >
                              {l.benh_nhan} · {l.viec ?? l.noi_dung ?? '—'} · {tenNgan(l.bac_si, 'bac_si')}
                            </Link>
                          </td>
                        )
                      }
                      if (!co)
                        return (
                          <td key={g.id} className="h-8 border-b border-l border-gray-100 bg-[repeating-linear-gradient(135deg,#f3f4f6_0_6px,#e5e7eb_6px_7px)]" />
                        )
                      return (
                        <td key={g.id} className="group h-8 border-b border-l border-gray-100 p-0.5">
                          <Link
                            href={`/lich-hen/dat${q_({ gio: k, ghe: g.id })}`}
                            className="block rounded border border-dashed border-transparent px-2 py-1 text-transparent group-hover:border-brand group-hover:text-brand"
                          >
                            + Đặt {k}
                          </Link>
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="space-y-4">
          <Card title="Bác sĩ trực">
            {ca.length === 0 && <p className="text-sm text-gray-500">Chưa xếp ca bác sĩ cho ngày này.</p>}
            <ul className="space-y-3">
              {bacSi.map(([id, ten]) => (
                <li key={id}>
                  <div className="text-sm font-semibold">{tenNgan(ten, 'bac_si')}</div>
                  <div className="text-xs text-gray-500">
                    {ca.filter((c) => c.nhan_vien_id === id).map((c) => `${gio(c.gio_bat_dau)} – ${gio(c.gio_ket_thuc)}`).join(', ')}
                  </div>
                  <div className="text-xs text-emerald-700">còn {conTrong(id)} khung trống</div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  )
}

// Suspense nằm trong trang để cả lần tải đầu lẫn khi chuyển trang đều hiện khung chờ ngay (Cache Components).
export default function Page(props: PageProps<'/lich-hen'>) {
  return (
    <Suspense fallback={<Skeleton />}>
      <LichHenPage {...props} />
    </Suspense>
  )
}
