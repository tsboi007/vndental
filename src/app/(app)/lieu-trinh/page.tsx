import { Suspense } from 'react'
import { Skeleton } from '@/components/Skeleton'
import Link from 'next/link'
import { Bar, Empty, PageTitle, Tabs } from '@/components/ui'
import { q } from '@/lib/db'
import { LOAI_LIEU_TRINH, ngay, str, tenNgan, vnd } from '@/lib/format'
import { requireNhanVien } from '@/lib/session'

export const metadata = { title: 'Liệu trình' }

async function LieuTrinhPage({ searchParams }: PageProps<'/lieu-trinh'>) {
  await requireNhanVien('bac_si', 'le_tan')
  const tt = str((await searchParams).tt) || 'dang_lam'
  const ds = await q<{ id: number; ten: string; loai: string; ho_ten: string; benh_nhan_id: number; bac_si: string; ngay_bat_dau: string; tong_so_buoi: number; tong_chi_phi: number; da_lam: number; da_lap: number }>(
    `SELECT lt.id, lt.ten, lt.loai, bn.ho_ten, lt.benh_nhan_id, bs.ho_ten AS bac_si, lt.ngay_bat_dau, lt.tong_so_buoi, lt.tong_chi_phi,
            (SELECT count(DISTINCT phieu_id) FROM chi_tiet_dieu_tri WHERE lieu_trinh_id = lt.id) AS da_lam,
            (SELECT coalesce(sum(d.so_tien), 0) FROM lieu_trinh_dot d WHERE d.lieu_trinh_id = lt.id
               AND EXISTS (SELECT 1 FROM chi_tiet_hoa_don c WHERE c.lieu_trinh_dot_id = d.id)) AS da_lap
     FROM lieu_trinh lt JOIN benh_nhan bn ON bn.id = lt.benh_nhan_id JOIN nhan_vien bs ON bs.id = lt.bac_si_phu_trach_id
     WHERE lt.trang_thai = $1 ORDER BY lt.ngay_bat_dau DESC`,
    [tt],
  )
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
