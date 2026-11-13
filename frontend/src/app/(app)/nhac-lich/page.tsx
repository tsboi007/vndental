import { Suspense } from 'react'
import { Skeleton } from '@/components/Skeleton'
import Link from 'next/link'
import { ActionForm } from '@/components/ActionForm'
import { Card, Empty, PageTitle, Tabs, Tile } from '@/components/ui'
import { gio, ngayDayDu, tenNgan } from '@/lib/format'
import { requireNhanVien } from '@/lib/session'
import { ghiNhac, guiTinHangLoat } from './actions'
import { trang } from '@/lib/api'

export const metadata = { title: 'Nhắc lịch' }

type Row = {
  id: number
  gio_bat_dau: string
  trang_thai: string
  ho_ten: string
  sdt: string
  bac_si: string
  ghe: string
  viec: string | null
  so_goi: number
  nghe: boolean
  khong_nghe: boolean
  da_gui_tin: boolean
}

function ketQua(r: Row): { nhom: 'chua_goi' | 'khong_nghe' | 'da_nhac'; nhan: string; cls: string } {
  if (r.nghe) return { nhom: 'da_nhac', nhan: 'Gọi: nghe máy', cls: 'text-emerald-700' }
  if (r.da_gui_tin) return { nhom: 'da_nhac', nhan: 'Không nghe · đã gửi tin', cls: 'text-amber-700' }
  if (r.khong_nghe) return { nhom: 'khong_nghe', nhan: `Không nghe (${r.so_goi} lần) · chưa gửi tin`, cls: 'text-amber-700' }
  return { nhom: 'chua_goi', nhan: 'Chưa gọi', cls: 'text-red-600' }
}

async function NhacLichPage({ searchParams }: PageProps<'/nhac-lich'>) {
  await requireNhanVien('le_tan')
  const sp = await searchParams
  const { ngay, loc, rows } = await trang('nhac-lich', sp)
  const dem = { chua_goi: 0, khong_nghe: 0, da_nhac: 0 }
  rows.forEach((r) => dem[ketQua(r).nhom]++)
  const hien = loc ? rows.filter((r) => ketQua(r).nhom === loc) : rows
  const can = rows.filter((r) => r.khong_nghe && !r.nghe && !r.da_gui_tin).length
  const tab = (k: string, label: string) => ({ href: `/nhac-lich?ngay=${ngay}${k ? `&loc=${k}` : ''}`, label, active: loc === k })

  return (
    <>
      <PageTitle title="Nhắc lịch" sub={`Lịch hẹn ${ngayDayDu(ngay)} — gọi trước một lượt, ai không nghe máy thì nhắn tin`}>
        <form className="flex gap-2">
          <input type="date" name="ngay" defaultValue={ngay} className="input w-40" />
          <button className="btn-sec">Xem</button>
        </form>
      </PageTitle>

      <div className="mb-4 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Tile label="Tổng lịch" value={rows.length} />
        <Tile label="Đã nhắc" value={dem.da_nhac} tone="green" />
        <Tile label="Không nghe máy" value={dem.khong_nghe} tone="amber" />
        <Tile label="Chưa gọi" value={dem.chua_goi} tone="red" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
        <div>
          <Tabs items={[tab('', `Tất cả (${rows.length})`), tab('chua_goi', `Chưa gọi (${dem.chua_goi})`), tab('khong_nghe', `Không nghe máy (${dem.khong_nghe})`), tab('da_nhac', `Đã nhắc (${dem.da_nhac})`)]} />
          <div className="card overflow-x-auto">
            <table className="tbl">
              <thead>
                <tr>
                  <th>Giờ</th><th>Bệnh nhân</th><th>SĐT</th><th>Bác sĩ · Ghế</th><th>Việc</th><th>Kết quả nhắc</th><th className="w-48">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {hien.map((r) => {
                  const k = ketQua(r)
                  return (
                    <tr key={r.id}>
                      <td className="tabular-nums">{gio(r.gio_bat_dau)}</td>
                      <td><Link href={`/lich-hen/${r.id}`} className="link">{r.ho_ten}</Link></td>
                      <td className="tabular-nums">{r.sdt}</td>
                      <td>{tenNgan(r.bac_si, 'bac_si')} · {r.ghe}</td>
                      <td>{r.viec ?? '—'}</td>
                      <td className={k.cls}>{k.nhan}</td>
                      <td>
                        {k.nhom !== 'da_nhac' && (
                          <div className="flex gap-1">
                            <ActionForm action={ghiNhac}>
                              <input type="hidden" name="id" value={r.id} />
                              <button name="kq" value="nghe_may" className="btn-ok btn-sm">Nghe máy</button>
                            </ActionForm>
                            {k.nhom === 'chua_goi' ? (
                              <ActionForm action={ghiNhac}>
                                <input type="hidden" name="id" value={r.id} />
                                <button name="kq" value="khong_nghe" className="btn-sec btn-sm">Không nghe</button>
                              </ActionForm>
                            ) : (
                              <ActionForm action={ghiNhac}>
                                <input type="hidden" name="id" value={r.id} />
                                <button name="kq" value="da_gui" className="btn-primary btn-sm">Gửi tin</button>
                              </ActionForm>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {hien.length === 0 && <Empty>Không có lịch hẹn nào.</Empty>}
          </div>
        </div>

        <Card title="Tin nhắn nhắc lịch">
          <p className="rounded-md bg-gray-50 p-3 text-sm text-gray-700">
            Nha khoa Nụ Cười Việt nhắc lịch: {'{Tên}'} có hẹn {'{giờ}'} ngày {'{ngày}'} với {'{bác sĩ}'}. Cần đổi lịch xin gọi {'{SĐT phòng khám}'}.
          </p>
          <ActionForm action={guiTinHangLoat} className="mt-3">
            <input type="hidden" name="ngay" value={ngay} />
            <button className="btn-primary w-full" disabled={!can}>Gửi tin cho {can} người không nghe máy</button>
          </ActionForm>
          <p className="mt-2 text-xs text-gray-500">
            Bản demo chỉ ghi nhận “đã gửi”; cần nối dịch vụ SMS (eSMS, SpeedSMS…) để gửi thật.
          </p>
        </Card>
      </div>
    </>
  )
}

// Suspense nằm trong trang để cả lần tải đầu lẫn khi chuyển trang đều hiện khung chờ ngay (Cache Components).
export default function Page(props: PageProps<'/nhac-lich'>) {
  return (
    <Suspense fallback={<Skeleton />}>
      <NhacLichPage {...props} />
    </Suspense>
  )
}
