import { Suspense } from 'react'
import { Skeleton } from '@/components/Skeleton'
import Link from 'next/link'
import { ActionForm } from '@/components/ActionForm'
import { Card, Empty, PageTitle, Tabs, Tile } from '@/components/ui'
import type { ActionState } from '@/lib/action'
import { gio, homNay, ngayDayDu, ngayGio, tenNgan, vnd } from '@/lib/format'
import { requireNhanVien } from '@/lib/session'
import { lenh, trang } from '@/lib/api'

export const metadata = { title: 'Đối soát cuối ngày' }

async function chotDoiSoat(_: ActionState, fd: FormData): Promise<ActionState> {
  'use server'
  return lenh('chotDoiSoat', fd)
}

async function DoiSoatPage({ searchParams }: PageProps<'/doi-soat'>) {
  await requireNhanVien('le_tan')
  const sp = await searchParams
  const { ngay, loc, thu, chot, no } = await trang('doi-soat', sp)
  const tm = thu.filter((t) => t.hinh_thuc === 'tien_mat')
  const ck = thu.filter((t) => t.hinh_thuc === 'chuyen_khoan')
  const tong = (a: typeof thu) => a.reduce((x, t) => x + t.so_tien, 0)
  const hien = loc === 'tat_ca' ? thu : loc === 'chuyen_khoan' ? ck : tm
  const tab = (k: string, l: string) => ({ href: `/doi-soat?ngay=${ngay}&loc=${k}`, label: l, active: loc === k })

  return (
    <>
      <PageTitle title="Đối soát cuối ngày" sub={ngayDayDu(ngay)}>
        <form className="flex gap-2">
          <input type="date" name="ngay" defaultValue={ngay} max={homNay()} className="input w-40" />
          <button className="btn-sec">Xem</button>
        </form>
      </PageTitle>
      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile label="Tổng thu" value={vnd(tong(thu))} sub={`${thu.length} lần thu · ${new Set(thu.map((t) => t.hoa_don_id)).size} hóa đơn`} />
        <Tile label="Tiền mặt" value={vnd(tong(tm))} sub={`${tm.length} lần thu`} />
        <Tile label="Chuyển khoản" value={vnd(tong(ck))} sub={`${ck.length} lần thu`} />
        <Tile label="Nợ phát sinh trong ngày" value={vnd(no.reduce((a, x) => a + x.con_no, 0))} sub={`${no.length} hóa đơn`} tone="red" />
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <Card title="Các lần thu" pad={false}>
          <div className="px-4 pt-2"><Tabs items={[tab('tien_mat', `Tiền mặt (${tm.length})`), tab('chuyen_khoan', `Chuyển khoản (${ck.length})`), tab('tat_ca', `Tất cả (${thu.length})`)]} /></div>
          <table className="tbl">
            <thead><tr><th>Giờ</th><th>Hóa đơn</th><th>Bệnh nhân</th><th className="num">Số tiền</th><th>Người thu</th></tr></thead>
            <tbody>
              {hien.map((t) => (
                <tr key={t.id}>
                  <td className="tabular-nums">{gio(t.thu_luc)}</td>
                  <td><Link href={`/hoa-don/${t.hoa_don_id}`} className="link">{t.ma_hoa_don}</Link></td>
                  <td>{t.ho_ten}</td>
                  <td className="num">{vnd(t.so_tien)}</td>
                  <td>{tenNgan(t.nguoi, 'le_tan')}</td>
                </tr>
              ))}
              {hien.length > 0 && (
                <tr className="bg-gray-50 font-semibold"><td colSpan={3}>Cộng</td><td className="num">{vnd(tong(hien))}</td><td /></tr>
              )}
            </tbody>
          </table>
          {hien.length === 0 && <Empty>Không có khoản thu.</Empty>}
        </Card>
        <div className="space-y-4">
          <Card title="Chốt két">
            {chot ? (
              <div className="space-y-1 text-sm">
                <div>Tiền mặt theo hệ thống: <b>{vnd(chot.tien_mat_he_thong)}</b></div>
                <div>Đếm được: <b>{vnd(chot.tien_mat_dem_duoc)}</b></div>
                <div className={chot.chenh_lech ? 'font-semibold text-red-600' : 'font-semibold text-emerald-700'}>Chênh lệch: {vnd(chot.chenh_lech)}</div>
                {chot.ghi_chu && <div className="text-gray-600">Ghi chú: {chot.ghi_chu}</div>}
                <div className="text-xs text-gray-500">Chốt bởi {tenNgan(chot.nguoi)} lúc {ngayGio(chot.doi_soat_luc)}. Mỗi ngày chốt một lần.</div>
              </div>
            ) : (
              <ActionForm action={chotDoiSoat} className="space-y-3">
                <input type="hidden" name="ngay" value={ngay} />
                <div><div className="text-xs text-gray-500">Tiền mặt theo hệ thống</div><div className="text-2xl font-semibold">{vnd(tong(tm))}</div></div>
                <label className="block"><span className="label">Tiền mặt đếm được trong két *</span><input name="dem" required className="input h-10 text-right text-lg" /></label>
                <label className="block"><span className="label">Ghi chú (bắt buộc khi lệch)</span><textarea name="ghi_chu" rows={2} className="input" /></label>
                <button className="btn-primary w-full">Chốt đối soát ngày {ngay.slice(8)}/{ngay.slice(5, 7)}</button>
              </ActionForm>
            )}
          </Card>
          <Card title="Hóa đơn còn nợ phát sinh trong ngày">
            {no.length === 0 ? <p className="text-sm text-gray-500">Không có.</p> : no.map((h) => (
              <div key={h.hoa_don_id} className="flex justify-between text-sm">
                <Link href={`/hoa-don/${h.hoa_don_id}`} className="link">{h.ma_hoa_don} · {h.ho_ten}</Link>
                <span className="text-red-600">{vnd(h.con_no)}</span>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </>
  )
}

// Suspense nằm trong trang để cả lần tải đầu lẫn khi chuyển trang đều hiện khung chờ ngay (Cache Components).
export default function Page(props: PageProps<'/doi-soat'>) {
  return (
    <Suspense fallback={<Skeleton />}>
      <DoiSoatPage {...props} />
    </Suspense>
  )
}
