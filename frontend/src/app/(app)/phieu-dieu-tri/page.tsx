import { Suspense } from 'react'
import { Skeleton } from '@/components/Skeleton'
import Link from 'next/link'
import { ActionForm } from '@/components/ActionForm'
import { Card, CanhBaoBN, Empty, PageTitle, TrangThai } from '@/components/ui'
import { gio, ngayDayDu, ngayGio, tenNgan } from '@/lib/format'
import { requireNhanVien } from '@/lib/session'
import { batDauKham } from './actions'
import { trang } from '@/lib/api'

export const metadata = { title: 'Phiếu điều trị' }

async function PhieuDieuTriPage({ searchParams }: PageProps<'/phieu-dieu-tri'>) {
  const nv = await requireNhanVien('bac_si')
  const sp = await searchParams
  const { tatCa, chon, hom, cho, phieu } = await trang('phieu-dieu-tri', sp)

  return (
    <>
      <PageTitle title="Phiếu điều trị" sub={`${ngayDayDu(hom)} · ${tatCa ? 'tất cả bác sĩ' : `bệnh nhân của ${tenNgan(nv.ho_ten, nv.vai_tro)}`}`}>
        {nv.vai_tro === 'bac_si' && (
          <Link href={tatCa ? '/phieu-dieu-tri' : '/phieu-dieu-tri?tat_ca=1'} className="btn-sec">{tatCa ? 'Chỉ bệnh nhân của tôi' : 'Xem tất cả bác sĩ'}</Link>
        )}
      </PageTitle>
      <div className="grid gap-4 xl:grid-cols-2">
        <Card title="Hàng chờ hôm nay" right="lễ tân xác nhận “đã đến” thì bệnh nhân lên đầu danh sách" pad={false}>
          <table className="tbl">
            <thead><tr><th>Giờ</th><th>Bệnh nhân</th><th>Việc</th>{tatCa && <th>Bác sĩ</th>}<th>Trạng thái</th><th /></tr></thead>
            <tbody>
              {cho.map((l) => (
                <tr key={l.id} className={l.id === chon ? 'bg-brand-50' : ''}>
                  <td className="tabular-nums">{gio(l.gio_bat_dau)} · {l.ghe}</td>
                  <td>
                    {l.ho_ten}
                    <div><CanhBaoBN bn={l} /></div>
                  </td>
                  <td>{l.viec ?? '—'}{l.noi_dung ? <div className="text-xs text-gray-500">{l.noi_dung}</div> : null}</td>
                  {tatCa && <td>{tenNgan(l.bac_si, 'bac_si')}</td>}
                  <td><TrangThai tt={l.trang_thai} /></td>
                  <td className="text-right">
                    {l.phieu_id ? (
                      <Link href={`/phieu-dieu-tri/${l.phieu_id}`} className="btn-sec btn-sm">Mở phiếu</Link>
                    ) : l.trang_thai === 'da_den' ? (
                      <ActionForm action={batDauKham}>
                        <input type="hidden" name="lich" value={l.id} />
                        <button className="btn-primary btn-sm">Bắt đầu khám</button>
                      </ActionForm>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {cho.length === 0 && <Empty>Không còn bệnh nhân chờ.</Empty>}
        </Card>

        <Card title="Phiếu đã lập hôm nay" pad={false}>
          <table className="tbl">
            <thead><tr><th>Giờ</th><th>Bệnh nhân</th><th>Việc đã làm</th>{tatCa && <th>BS chính</th>}<th>Tình trạng</th></tr></thead>
            <tbody>
              {phieu.map((p) => (
                <tr key={p.id}>
                  <td className="tabular-nums">{ngayGio(p.kham_luc).slice(11)}</td>
                  <td><Link href={`/phieu-dieu-tri/${p.id}`} className="link">{p.ho_ten}</Link></td>
                  <td>{p.viec ?? <span className="text-gray-400">chưa ghi</span>}</td>
                  {tatCa && <td>{tenNgan(p.bac_si, 'bac_si')}</td>}
                  <td className="text-xs">
                    {p.co_hoa_don ? 'Đã lập hóa đơn' : p.trang_thai === 'dang_kham' ? <span className="text-amber-700">Đang khám</span> : 'Chờ thanh toán'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {phieu.length === 0 && <Empty>Chưa có phiếu nào hôm nay.</Empty>}
        </Card>
      </div>
    </>
  )
}

// Suspense nằm trong trang để cả lần tải đầu lẫn khi chuyển trang đều hiện khung chờ ngay (Cache Components).
export default function Page(props: PageProps<'/phieu-dieu-tri'>) {
  return (
    <Suspense fallback={<Skeleton />}>
      <PhieuDieuTriPage {...props} />
    </Suspense>
  )
}
