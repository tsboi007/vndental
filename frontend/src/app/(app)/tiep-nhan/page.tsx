import { Suspense } from 'react'
import { Skeleton } from '@/components/Skeleton'
import Link from 'next/link'
import { ActionForm } from '@/components/ActionForm'
import { Card, CanhBaoBN, Empty, PageTitle, Tabs, TrangThai } from '@/components/ui'
import { gio, ngayDayDu, tenNgan, tuoi, vnd } from '@/lib/format'
import { requireNhanVien } from '@/lib/session'
import { doiTrangThai } from '../lich-hen/actions'
import { khamVangLai } from '../phieu-dieu-tri/actions'
import { trang } from '@/lib/api'

export const metadata = { title: 'Tiếp nhận' }

async function TiepNhanPage({ searchParams }: PageProps<'/tiep-nhan'>) {
  await requireNhanVien('le_tan')
  const sp = await searchParams
  const { tim, loc, hom, lich, nhom, hien, ketQua, bn, lichBn, tomTat, ca, ghe } = await trang('tiep-nhan', sp)
  const tab = (k: string, label: string) => ({ href: `/tiep-nhan?loc=${k}${tim ? `&sdt=${tim}` : ''}`, label, active: loc === k })
  const dem = (k: string) => lich.filter((l) => nhom[k].includes(l.trang_thai)).length

  return (
    <>
      <PageTitle title="Tiếp nhận" sub={`${ngayDayDu(hom)} · bệnh nhân đọc số điện thoại khi tới quầy`}>
        <form className="flex gap-2">
          <input name="sdt" defaultValue={tim} placeholder="Số điện thoại / họ tên" className="input h-10 w-72 text-base" autoFocus />
          <button className="btn-primary h-10">Tìm</button>
        </form>
        <Link href={`/benh-nhan/moi${tim ? `?sdt=${encodeURIComponent(tim)}` : ''}`} className="btn-sec h-10">+ Khách mới</Link>
      </PageTitle>

      <div className="grid gap-4 xl:grid-cols-[1fr_420px]">
        <Card title="Lịch hẹn hôm nay" right={`${lich.length} lịch`} pad={false}>
          <div className="px-4 pt-2">
            <Tabs items={[tab('cho', `Sắp tới (${dem('cho')})`), tab('den', `Đã đến (${dem('den')})`), tab('xong', `Đã xong (${dem('xong')})`), tab('tat_ca', 'Tất cả')]} />
          </div>
          <table className="tbl">
            <thead>
              <tr><th>Giờ</th><th>Bệnh nhân</th><th>Bác sĩ</th><th>Ghế</th><th>Trạng thái</th><th /></tr>
            </thead>
            <tbody>
              {hien.map((l) => (
                <tr key={l.id}>
                  <td className="tabular-nums">{gio(l.gio_bat_dau)}</td>
                  <td><Link href={`/lich-hen/${l.id}`} className="link">{l.ho_ten}</Link><div className="text-xs text-gray-500">{l.viec ?? ''}</div></td>
                  <td>{tenNgan(l.bac_si, 'bac_si')}</td>
                  <td>{l.ghe}</td>
                  <td><TrangThai tt={l.trang_thai} /></td>
                  <td className="text-right">
                    {['da_dat', 'da_nhac'].includes(l.trang_thai) && (
                      <ActionForm action={doiTrangThai}>
                        <input type="hidden" name="id" value={l.id} />
                        <input type="hidden" name="tt" value="da_den" />
                        <button className="btn-sec btn-sm">Tiếp nhận</button>
                      </ActionForm>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {hien.length === 0 && <Empty>Không có lịch nào.</Empty>}
        </Card>

        <div className="space-y-4">
          <Card title={tim ? `Kết quả: ${tim}` : 'Tìm bệnh nhân'} right={tim ? `${ketQua.length} hồ sơ` : undefined}>
            {!tim && <p className="text-sm text-gray-500">Nhập số điện thoại ở ô tìm kiếm phía trên.</p>}
            {tim && ketQua.length === 0 && (
              <p className="text-sm text-gray-500">
                Không có hồ sơ. <Link href={`/benh-nhan/moi?sdt=${encodeURIComponent(tim)}`} className="link">Tạo hồ sơ mới</Link>
              </p>
            )}
            <div className="space-y-1.5">
              {ketQua.map((b) => (
                <Link key={b.id} href={`/tiep-nhan?sdt=${encodeURIComponent(tim)}&bn=${b.id}&loc=${loc}`} className={`flex justify-between rounded-md border px-3 py-2 text-sm ${b.id === bn?.id ? 'border-brand bg-brand-50 font-semibold' : 'border-gray-200 hover:border-brand'}`}>
                  <span>{b.ho_ten}</span>
                  <span className="font-normal text-gray-500">{b.ngay_sinh ? tuoi(b.ngay_sinh) : ''} · {b.sdt_la_cua ? `số của ${b.sdt_la_cua.toLowerCase()}` : 'chủ số'}</span>
                </Link>
              ))}
            </div>
          </Card>

          {bn && (
            <Card title={bn.ho_ten} right={bn.ma_ho_so}>
              <div className="space-y-2 text-sm">
                <div className="text-gray-600">
                  {bn.gioi_tinh === 'M' ? 'Nam' : bn.gioi_tinh === 'F' ? 'Nữ' : ''} {bn.ngay_sinh ? `· ${tuoi(bn.ngay_sinh)}` : ''} · SĐT {bn.sdt}
                  {bn.sdt_la_cua ? ` — của ${bn.sdt_la_cua.toLowerCase()} (${bn.ten_nguoi_giam_ho})` : ''}
                </div>
                <CanhBaoBN bn={bn} />
                <div className="border-t border-gray-100 pt-2">
                  <div className="text-xs text-gray-500">Lịch hẹn hôm nay</div>
                  {lichBn.length === 0 && <div>Không có</div>}
                  {lichBn.map((l) => (
                    <div key={l.id} className="mt-1 flex items-center justify-between gap-2">
                      <span className="font-medium">{gio(l.gio_bat_dau)} · {tenNgan(l.bac_si, 'bac_si')} · {l.ghe} · {l.viec ?? '—'}</span>
                      <TrangThai tt={l.trang_thai} />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 border-t border-gray-100 pt-2">
                  <div><div className="text-xs text-gray-500">Còn nợ</div><div className={tomTat?.con_no ? 'font-semibold text-red-600' : 'font-semibold'}>{vnd(tomTat?.con_no)}</div></div>
                  <div><div className="text-xs text-gray-500">Liệu trình đang làm</div><div>{tomTat?.lieu_trinh ?? 'Không có'}</div></div>
                </div>
                {lichBn.filter((l) => ['da_dat', 'da_nhac'].includes(l.trang_thai)).map((l) => (
                  <ActionForm key={l.id} action={doiTrangThai}>
                    <input type="hidden" name="id" value={l.id} />
                    <input type="hidden" name="tt" value="da_den" />
                    <button className="btn-primary w-full">Xác nhận đã đến · {gio(l.gio_bat_dau)}</button>
                  </ActionForm>
                ))}
                <details className="rounded-md border border-gray-200 p-2">
                  <summary className="cursor-pointer text-sm font-medium">Khám không hẹn (vãng lai)</summary>
                  <ActionForm action={khamVangLai} className="mt-2 grid grid-cols-2 gap-2">
                    <input type="hidden" name="bn" value={bn.id} />
                    <select name="bs" required className="input" defaultValue="">
                      <option value="" disabled>Bác sĩ đang trực</option>
                      {[...new Map(ca.map((c) => [c.nhan_vien_id, c.ho_ten])).entries()].map(([id, ten]) => (
                        <option key={id} value={id}>{tenNgan(ten, 'bac_si')}</option>
                      ))}
                    </select>
                    <select name="ghe" required className="input" defaultValue="">
                      <option value="" disabled>Ghế</option>
                      {ghe.map((g) => <option key={g.id} value={g.id}>{g.ten}</option>)}
                    </select>
                    <button className="btn-sec col-span-2">Tạo phiếu điều trị</button>
                  </ActionForm>
                </details>
                <div className="flex justify-between pt-1">
                  <Link href={`/benh-nhan/${bn.id}`} className="link">Mở hồ sơ</Link>
                  <Link href={`/lich-hen/dat?bn=${bn.id}`} className="link">Đặt lịch khác</Link>
                </div>
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}

// Suspense nằm trong trang để cả lần tải đầu lẫn khi chuyển trang đều hiện khung chờ ngay (Cache Components).
export default function Page(props: PageProps<'/tiep-nhan'>) {
  return (
    <Suspense fallback={<Skeleton />}>
      <TiepNhanPage {...props} />
    </Suspense>
  )
}
