import { Suspense } from 'react'
import { Skeleton } from '@/components/Skeleton'
import Link from 'next/link'
import { CanhBaoBN, Empty, PageTitle } from '@/components/ui'
import { q } from '@/lib/db'
import { timBenhNhan, type BenhNhan } from '@/lib/data'
import { ngay, str, tuoi } from '@/lib/format'
import { requireNhanVien } from '@/lib/session'

export const metadata = { title: 'Bệnh nhân' }

async function BenhNhanPage({ searchParams }: PageProps<'/benh-nhan'>) {
  await requireNhanVien('le_tan', 'bac_si')
  const tim = str((await searchParams).q)
  const ds = tim
    ? await timBenhNhan(tim, 100)
    : await q<BenhNhan & { lan_cuoi: string | null }>(
        `SELECT bn.*, max(p.kham_luc) AS lan_cuoi FROM benh_nhan bn LEFT JOIN phieu_dieu_tri p ON p.benh_nhan_id = bn.id
         GROUP BY bn.id ORDER BY max(p.kham_luc) DESC NULLS LAST LIMIT 50`,
      )
  const tong = await q<{ n: number }>('SELECT count(*) AS n FROM benh_nhan')

  return (
    <>
      <PageTitle title="Bệnh nhân" sub={`${tong[0].n} hồ sơ · ${tim ? `kết quả tìm "${tim}"` : '50 người khám gần đây nhất'}`}>
        <form className="flex gap-2">
          <input name="q" defaultValue={tim} placeholder="SĐT, mã hồ sơ hoặc họ tên" className="input w-72" />
          <button className="btn-sec">Tìm</button>
        </form>
        <Link href="/benh-nhan/moi" className="btn-primary">+ Tạo hồ sơ</Link>
      </PageTitle>
      <div className="card overflow-x-auto">
        <table className="tbl">
          <thead>
            <tr><th>Mã hồ sơ</th><th>Họ tên</th><th>Ngày sinh</th><th>Điện thoại</th><th>Dị ứng / tiền sử</th>{!tim && <th>Lần khám gần nhất</th>}</tr>
          </thead>
          <tbody>
            {ds.map((b) => (
              <tr key={b.id}>
                <td className="text-gray-500">{b.ma_ho_so}</td>
                <td><Link href={`/benh-nhan/${b.id}`} className="link font-medium">{b.ho_ten}</Link></td>
                <td>{b.ngay_sinh ? `${ngay(b.ngay_sinh)} · ${tuoi(b.ngay_sinh)}` : '—'}</td>
                <td className="tabular-nums">{b.sdt}{b.sdt_la_cua ? <span className="text-gray-500"> ({b.sdt_la_cua.toLowerCase()})</span> : ''}</td>
                <td><CanhBaoBN bn={b} /></td>
                {!tim && <td>{ngay((b as { lan_cuoi?: string | null }).lan_cuoi)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
        {ds.length === 0 && <Empty>Không tìm thấy hồ sơ.</Empty>}
      </div>
    </>
  )
}

// Suspense nằm trong trang để cả lần tải đầu lẫn khi chuyển trang đều hiện khung chờ ngay (Cache Components).
export default function Page(props: PageProps<'/benh-nhan'>) {
  return (
    <Suspense fallback={<Skeleton />}>
      <BenhNhanPage {...props} />
    </Suspense>
  )
}
