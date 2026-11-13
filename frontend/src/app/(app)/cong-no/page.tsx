import { Suspense } from 'react'
import { Skeleton } from '@/components/Skeleton'
import Link from 'next/link'
import { Empty, PageTitle, Tile } from '@/components/ui'
import { chiSo } from '@/lib/data'
import { ngay, vnd } from '@/lib/format'
import { requireNhanVien } from '@/lib/session'
import { trang } from '@/lib/api'

export const metadata = { title: 'Công nợ' }

type HD = { hoa_don_id: number; ma_hoa_don: string; lap_luc: string; tong_tien: number; da_thu: number; con_no: number; benh_nhan_id: number; ho_ten: string; sdt: string; noi_dung: string | null; so_ngay: number }

async function CongNoPage({ searchParams }: PageProps<'/cong-no'>) {
  await requireNhanVien('quan_ly')
  const sp = await searchParams
  const { tim, qua30, rows, thuThang } = await trang('cong-no', sp)
  const nhom = new Map<number, HD[]>()
  for (const r of rows) nhom.set(r.benh_nhan_id, [...(nhom.get(r.benh_nhan_id) ?? []), r])
  let ds = [...nhom.values()].map((hs) => ({ bn: hs[0], hs, tong: hs.reduce((a, h) => a + h.con_no, 0), cuNhat: hs[0].lap_luc, soNgay: hs[0].so_ngay }))
  if (tim) ds = ds.filter((x) => x.bn.ho_ten.toLowerCase().includes(tim.toLowerCase()) || (chiSo(tim) && x.bn.sdt.includes(chiSo(tim))))
  if (qua30) ds = ds.filter((x) => x.soNgay > 30)
  ds.sort((a, b) => b.tong - a.tong)
  const tong = rows.reduce((a, r) => a + r.con_no, 0)
  const qua = rows.filter((r) => r.so_ngay > 30)

  return (
    <>
      <PageTitle title="Công nợ" sub="Còn nợ = tổng các dòng hóa đơn − tổng các lần thu, theo từng hóa đơn">
        <form className="flex items-center gap-2">
          <input name="q" defaultValue={tim} placeholder="Tên / SĐT" className="input w-56" />
          <label className="flex items-center gap-1.5 text-sm"><input type="checkbox" name="qua30" value="1" defaultChecked={qua30} /> Chỉ nợ quá 30 ngày</label>
          <button className="btn-sec">Lọc</button>
        </form>
      </PageTitle>
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile label="Tổng khách đang nợ" value={vnd(tong)} sub={`${rows.length} hóa đơn`} tone="red" />
        <Tile label="Số bệnh nhân nợ" value={nhom.size} />
        <Tile label="Nợ quá 30 ngày" value={vnd(qua.reduce((a, r) => a + r.con_no, 0))} sub={`${new Set(qua.map((r) => r.benh_nhan_id)).size} người`} tone="amber" />
        <Tile label="Thu nợ tháng này" value={vnd(thuThang[0].tong)} sub={`${thuThang[0].lan} lần thu`} tone="green" />
      </div>
      <div className="card overflow-x-auto">
        <table className="tbl">
          <thead><tr><th>Bệnh nhân / hóa đơn</th><th>SĐT / nội dung</th><th className="num">Số HĐ nợ</th><th className="num">Còn nợ</th><th>HĐ nợ cũ nhất</th><th className="num">Số ngày</th></tr></thead>
          {ds.map((x) => (
            <tbody key={x.bn.benh_nhan_id} className="border-b border-gray-200">
              <tr className="bg-white">
                <td><Link href={`/benh-nhan/${x.bn.benh_nhan_id}?tab=hoa-don`} className="link font-medium">{x.bn.ho_ten}</Link></td>
                <td className="tabular-nums">{x.bn.sdt}</td>
                <td className="num">{x.hs.length}</td>
                <td className="num font-semibold text-red-600">{vnd(x.tong)}</td>
                <td>{ngay(x.cuNhat)}</td>
                <td className={`num ${x.soNgay > 30 ? 'font-semibold text-amber-700' : ''}`}>{x.soNgay}</td>
              </tr>
              {x.hs.length > 1 && x.hs.map((h) => (
                <tr key={h.hoa_don_id} className="bg-gray-50/60 text-xs">
                  <td className="pl-8"><Link href={`/hoa-don/${h.hoa_don_id}`} className="link">{h.ma_hoa_don}</Link> · {ngay(h.lap_luc)}</td>
                  <td className="max-w-xs truncate text-gray-600">{h.noi_dung}</td>
                  <td />
                  <td className="num">{vnd(h.con_no)}</td>
                  <td colSpan={2} />
                </tr>
              ))}
              {x.hs.length === 1 && (
                <tr className="bg-gray-50/60 text-xs">
                  <td className="pl-8"><Link href={`/hoa-don/${x.hs[0].hoa_don_id}`} className="link">{x.hs[0].ma_hoa_don}</Link></td>
                  <td colSpan={5} className="truncate text-gray-600">{x.hs[0].noi_dung}</td>
                </tr>
              )}
            </tbody>
          ))}
          <tfoot>
            <tr className="bg-gray-50 font-semibold"><td colSpan={3} className="px-3 py-2">Tổng {tim || qua30 ? 'theo bộ lọc' : 'toàn phòng khám'}</td><td className="num px-3 text-red-600">{vnd(ds.reduce((a, x) => a + x.tong, 0))}</td><td colSpan={2} /></tr>
          </tfoot>
        </table>
        {ds.length === 0 && <Empty>Không có khoản nợ nào.</Empty>}
      </div>
    </>
  )
}

// Suspense nằm trong trang để cả lần tải đầu lẫn khi chuyển trang đều hiện khung chờ ngay (Cache Components).
export default function Page(props: PageProps<'/cong-no'>) {
  return (
    <Suspense fallback={<Skeleton />}>
      <CongNoPage {...props} />
    </Suspense>
  )
}
