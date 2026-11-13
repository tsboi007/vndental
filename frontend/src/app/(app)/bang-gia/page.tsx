import { Suspense } from 'react'
import { Skeleton } from '@/components/Skeleton'
import Link from 'next/link'
import { ActionForm } from '@/components/ActionForm'
import { Card, PageTitle } from '@/components/ui'
import type { ActionState } from '@/lib/action'
import { lenh, trang } from '@/lib/api'
import { congNgay, homNay, ngay, so, tenNgan, vnd } from '@/lib/format'
import { requireNhanVien } from '@/lib/session'

export const metadata = { title: 'Bảng giá' }

async function datGiaMoi(_: ActionState, fd: FormData): Promise<ActionState> {
  'use server'
  return lenh('datGiaMoi', fd)
}

async function themDichVu(_: ActionState, fd: FormData): Promise<ActionState> {
  'use server'
  return lenh('themDichVuNhanh', fd)
}


async function BangGiaPage({ searchParams }: PageProps<'/bang-gia'>) {
  await requireNhanVien('quan_ly')
  const { ds, dv, lichSu } = await trang('bang-gia', await searchParams)
  const hom = homNay()

  return (
    <>
      <PageTitle title="Bảng giá" sub="Giá đổi theo thời gian; hóa đơn đã lập giữ nguyên giá lúc làm" />
      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="card overflow-x-auto">
          <table className="tbl">
            <thead><tr><th>Mã</th><th>Dịch vụ</th><th>Đơn vị</th><th className="num">Giá hiện hành</th><th>Áp dụng từ</th></tr></thead>
            <tbody>
              {ds.map((d) => (
                <tr key={d.id} className={d.id === dv?.id ? 'bg-brand-50' : ''}>
                  <td className="text-gray-500">{d.ma}</td>
                  <td><Link href={`/bang-gia?dv=${d.id}`} className="link">{d.ten}</Link></td>
                  <td>{d.don_vi}</td>
                  <td className="num font-medium">{d.gia == null ? <span className="text-red-600">chưa có giá</span> : so(d.gia)}</td>
                  <td>{ngay(d.tu)}{d.tu && d.tu > congNgay(hom, -31) ? <span className="ml-1 text-xs text-brand">· mới</span> : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="space-y-4">
          {dv && (
            <Card title={`${dv.ten} · ${dv.ma}`}>
              <div className="mb-1 text-xs font-semibold text-gray-500">Lịch sử giá</div>
              <div className="space-y-2">
                {lichSu.map((l, i) => {
                  const dang = l.hieu_luc_tu <= hom && (!l.hieu_luc_den || l.hieu_luc_den > hom)
                  return (
                    <div key={i} className={`rounded-md border px-3 py-2 ${dang ? 'border-brand bg-brand-50' : 'border-gray-200 bg-gray-50'}`}>
                      <div className="flex justify-between"><b>{vnd(l.don_gia)}</b>{dang && <span className="chip border-brand bg-brand text-white">Đang áp dụng</span>}{l.hieu_luc_tu > hom && <span className="chip border-amber-300 bg-amber-50 text-amber-800">Sắp áp dụng</span>}</div>
                      <div className="text-xs text-gray-500">{ngay(l.hieu_luc_tu)} → {l.hieu_luc_den ? ngay(congNgay(l.hieu_luc_den, -1)) : 'nay'} · {l.nguoi ? tenNgan(l.nguoi) : ''}</div>
                    </div>
                  )
                })}
              </div>
              <ActionForm action={datGiaMoi} className="mt-4 grid grid-cols-2 gap-2 border-t border-gray-100 pt-3" resetOnOk>
                <input type="hidden" name="dv" value={dv.id} />
                <label><span className="label">Đơn giá mới *</span><input name="don_gia" required className="input text-right" /></label>
                <label><span className="label">Áp dụng từ ngày *</span><input name="tu" type="date" defaultValue={congNgay(hom, 1)} required className="input" /></label>
                <button className="btn-primary col-span-2">Lưu giá mới</button>
                <p className="col-span-2 text-xs text-gray-500">Không sửa / xóa giá cũ. Giá đang áp dụng tự kết thúc vào ngày giá mới bắt đầu.</p>
              </ActionForm>
            </Card>
          )}
          <Card title="Thêm dịch vụ">
            <ActionForm action={themDichVu} className="grid grid-cols-3 gap-2" resetOnOk>
              <input name="ma" placeholder="Mã *" className="input" />
              <input name="ten" placeholder="Tên dịch vụ *" className="input col-span-2" />
              <input name="don_vi" placeholder="Đơn vị (lần, răng…)" className="input" />
              <input name="don_gia" placeholder="Giá *" className="input" />
              <button className="btn-sec">Thêm</button>
            </ActionForm>
          </Card>
        </div>
      </div>
    </>
  )
}

// Suspense nằm trong trang để cả lần tải đầu lẫn khi chuyển trang đều hiện khung chờ ngay (Cache Components).
export default function Page(props: PageProps<'/bang-gia'>) {
  return (
    <Suspense fallback={<Skeleton />}>
      <BangGiaPage {...props} />
    </Suspense>
  )
}
