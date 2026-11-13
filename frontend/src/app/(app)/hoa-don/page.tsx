import { Suspense } from 'react'
import { Skeleton } from '@/components/Skeleton'
import Link from 'next/link'
import { ActionForm } from '@/components/ActionForm'
import { Card, Empty, PageTitle } from '@/components/ui'
import { ngayGio, tenNgan, vnd } from '@/lib/format'
import { requireNhanVien } from '@/lib/session'
import { lapHoaDon } from './actions'
import { trang } from '@/lib/api'

export const metadata = { title: 'Hóa đơn & thu tiền' }

async function HoaDonPage({ searchParams }: PageProps<'/hoa-don'>) {
  await requireNhanVien('le_tan')
  const { tim, cho, ds } = await trang('hoa-don', await searchParams)

  return (
    <>
      <PageTitle title="Hóa đơn & thu tiền" sub="Giá lấy theo bảng giá ngày khám và được chốt vào hóa đơn">
        <form className="flex gap-2">
          <input name="q" defaultValue={tim} placeholder="Mã HĐ, SĐT hoặc tên bệnh nhân" className="input w-72" />
          <button className="btn-sec">Tìm</button>
        </form>
      </PageTitle>
      <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
        <Card title={`Chờ thanh toán (${cho.length})`} pad={false}>
          <ul className="divide-y divide-gray-100">
            {cho.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 px-4 py-2.5">
                <div className="min-w-0">
                  <div className="font-medium">{p.ho_ten}</div>
                  <div className="truncate text-xs text-gray-500">{tenNgan(p.bac_si, 'bac_si')} · {ngayGio(p.kham_luc)} · {p.viec ?? 'thuốc'}</div>
                </div>
                <ActionForm action={lapHoaDon}>
                  <input type="hidden" name="phieu" value={p.id} />
                  <button className="btn-primary btn-sm">Lập hóa đơn</button>
                </ActionForm>
              </li>
            ))}
          </ul>
          {cho.length === 0 && <Empty>Không có phiếu chờ.</Empty>}
        </Card>
        <Card title={tim ? `Kết quả tìm "${tim}"` : 'Hóa đơn lập hôm nay'} pad={false}>
          <table className="tbl">
            <thead><tr><th>Mã</th><th>Lập lúc</th><th>Bệnh nhân</th><th className="num">Tổng</th><th className="num">Đã thu</th><th className="num">Còn nợ</th></tr></thead>
            <tbody>
              {ds.map((h) => (
                <tr key={h.hoa_don_id}>
                  <td><Link href={`/hoa-don/${h.hoa_don_id}`} className="link">{h.ma_hoa_don}</Link></td>
                  <td>{ngayGio(h.lap_luc)}</td>
                  <td>{h.ho_ten}</td>
                  <td className="num">{vnd(h.tong_tien)}</td>
                  <td className="num">{vnd(h.da_thu)}</td>
                  <td className={`num ${h.con_no > 0 ? 'font-semibold text-red-600' : ''}`}>{vnd(h.con_no)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {ds.length === 0 && <Empty>Không có hóa đơn.</Empty>}
        </Card>
      </div>
    </>
  )
}

// Suspense nằm trong trang để cả lần tải đầu lẫn khi chuyển trang đều hiện khung chờ ngay (Cache Components).
export default function Page(props: PageProps<'/hoa-don'>) {
  return (
    <Suspense fallback={<Skeleton />}>
      <HoaDonPage {...props} />
    </Suspense>
  )
}
