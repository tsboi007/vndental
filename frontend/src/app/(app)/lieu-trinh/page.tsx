import { Suspense } from 'react'
import { Skeleton } from '@/components/Skeleton'
import Link from 'next/link'
import { Bar, Empty, PageTitle, Tabs } from '@/components/ui'
import { LOAI_LIEU_TRINH, ngay, tenNgan, vnd } from '@/lib/format'
import { requireNhanVien } from '@/lib/session'
import { trang } from '@/lib/api'

export const metadata = { title: 'Liệu trình' }

async function LieuTrinhPage({ searchParams }: PageProps<'/lieu-trinh'>) {
  await requireNhanVien('bac_si', 'le_tan')
  const { tt, ds } = await trang('lieu-trinh', await searchParams)
  const tab = (k: string, l: string) => ({ href: `/lieu-trinh?tt=${k}`, label: l, active: tt === k })

  return (
    <>
      <PageTitle title="Liệu trình" sub="Niềng răng, implant… kéo dài nhiều buổi, thu tiền theo đợt">
        <Link href="/lieu-trinh/moi" className="btn-primary">+ Mở liệu trình</Link>
      </PageTitle>
      <Tabs items={[tab('dang_lam', 'Đang làm'), tab('hoan_thanh', 'Hoàn thành'), tab('da_dung', 'Đã dừng')]} />
      <div className="card overflow-x-auto">
        <table className="tbl">
          <thead><tr><th>Liệu trình</th><th>Bệnh nhân</th><th>Bác sĩ</th><th>Bắt đầu</th><th className="w-48">Tiến độ</th><th className="num">Đã lập HĐ / tổng</th></tr></thead>
          <tbody>
            {ds.map((l) => (
              <tr key={l.id}>
                <td><Link href={`/lieu-trinh/${l.id}`} className="link font-medium">{l.ten}</Link><div className="text-xs text-gray-500">{LOAI_LIEU_TRINH[l.loai]}</div></td>
                <td><Link href={`/benh-nhan/${l.benh_nhan_id}`} className="link">{l.ho_ten}</Link></td>
                <td>{tenNgan(l.bac_si, 'bac_si')}</td>
                <td>{ngay(l.ngay_bat_dau)}</td>
                <td><div className="mb-1 text-xs">{l.da_lam}/{l.tong_so_buoi} buổi · còn {Math.max(0, l.tong_so_buoi - l.da_lam)}</div><Bar pct={l.da_lam / l.tong_so_buoi} /></td>
                <td className="num">{vnd(l.da_lap)} / {vnd(l.tong_chi_phi)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {ds.length === 0 && <Empty>Không có liệu trình.</Empty>}
      </div>
    </>
  )
}

// Suspense nằm trong trang để cả lần tải đầu lẫn khi chuyển trang đều hiện khung chờ ngay (Cache Components).
export default function Page(props: PageProps<'/lieu-trinh'>) {
  return (
    <Suspense fallback={<Skeleton />}>
      <LieuTrinhPage {...props} />
    </Suspense>
  )
}
