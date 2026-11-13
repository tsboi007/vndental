import { Suspense } from 'react'
import { Skeleton } from '@/components/Skeleton'
import Link from 'next/link'
import { ActionForm } from '@/components/ActionForm'
import { Card, PageTitle } from '@/components/ui'
import { homNay, LOAI_LIEU_TRINH, tenNgan } from '@/lib/format'
import { requireNhanVien } from '@/lib/session'
import { moLieuTrinh } from '../actions'
import { trang } from '@/lib/api'

export const metadata = { title: 'Mở liệu trình' }

async function MoLieuTrinhPage({ searchParams }: PageProps<'/lieu-trinh/moi'>) {
  const nv = await requireNhanVien('bac_si')
  const sp = await searchParams
  const { bn, tim, ketQua, bacSi } = await trang('lieu-trinh-moi', sp)

  return (
    <>
      <PageTitle title="Mở liệu trình">
        <Link href="/lieu-trinh" className="btn-sec">← Danh sách</Link>
      </PageTitle>
      <Card className="max-w-3xl">
        {!bn ? (
          <>
            <form className="flex gap-2">
              <input name="tim" defaultValue={tim} placeholder="Tìm bệnh nhân: SĐT, mã hồ sơ, họ tên" className="input" />
              <button className="btn-sec">Tìm</button>
            </form>
            <div className="mt-3 space-y-1.5">
              {ketQua.map((b) => (
                <Link key={b.id} href={`/lieu-trinh/moi?bn=${b.id}`} className="block rounded-md border border-gray-200 px-3 py-2 text-sm hover:border-brand">
                  {b.ho_ten} · <span className="text-gray-500">{b.ma_ho_so} · {b.sdt}</span>
                </Link>
              ))}
            </div>
          </>
        ) : (
          <ActionForm action={moLieuTrinh} className="grid gap-3 sm:grid-cols-6">
            <input type="hidden" name="bn" value={bn.id} />
            <div className="sm:col-span-6 text-sm">Bệnh nhân: <b>{bn.ho_ten}</b> · {bn.ma_ho_so} <Link href="/lieu-trinh/moi" className="link ml-2">đổi</Link></div>
            <label className="sm:col-span-2"><span className="label">Loại *</span>
              <select name="loai" className="input">{Object.entries(LOAI_LIEU_TRINH).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select>
            </label>
            <label className="sm:col-span-4"><span className="label">Tên liệu trình *</span><input name="ten" required placeholder="VD: Niềng mắc cài kim loại 2 hàm" className="input" /></label>
            <label className="sm:col-span-2"><span className="label">Bác sĩ phụ trách *</span>
              <select name="bs" defaultValue={nv.vai_tro === 'bac_si' ? nv.id : ''} className="input">
                {bacSi.map((b) => <option key={b.id} value={b.id}>{tenNgan(b.ho_ten, 'bac_si')}</option>)}
              </select>
            </label>
            <label><span className="label">Tổng số buổi *</span><input name="tong_so_buoi" type="number" min={1} required className="input" /></label>
            <label className="sm:col-span-2"><span className="label">Tổng chi phí (đ) *</span><input name="tong_chi_phi" required placeholder="30000000" className="input" /></label>
            <label><span className="label">Số đợt thu</span><input name="so_dot" type="number" min={1} defaultValue={3} className="input" /></label>
            <label className="sm:col-span-2"><span className="label">Ngày bắt đầu *</span><input name="ngay_bat_dau" type="date" defaultValue={homNay()} className="input" /></label>
            <label className="sm:col-span-4"><span className="label">Ghi chú</span><input name="ghi_chu" className="input" /></label>
            <p className="sm:col-span-6 text-xs text-gray-500">Tổng chi phí được chia đều thành các đợt (sửa từng đợt sau). Dịch vụ “Tái khám niềng” trong liệu trình có giá 0 đ; tiền thu theo đợt trên hóa đơn.</p>
            <div className="sm:col-span-6 flex justify-end"><button className="btn-primary">Mở liệu trình</button></div>
          </ActionForm>
        )}
      </Card>
    </>
  )
}

// Suspense nằm trong trang để cả lần tải đầu lẫn khi chuyển trang đều hiện khung chờ ngay (Cache Components).
export default function Page(props: PageProps<'/lieu-trinh/moi'>) {
  return (
    <Suspense fallback={<Skeleton />}>
      <MoLieuTrinhPage {...props} />
    </Suspense>
  )
}
