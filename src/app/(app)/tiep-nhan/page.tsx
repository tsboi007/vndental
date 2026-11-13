import { Suspense } from 'react'
import { Skeleton } from '@/components/Skeleton'
import Link from 'next/link'
import { ActionForm } from '@/components/ActionForm'
import { Card, CanhBaoBN, Empty, PageTitle, Tabs, TrangThai } from '@/components/ui'
import { q } from '@/lib/db'
import { caTrucNgay, timBenhNhan } from '@/lib/data'
import { gio, homNay, ngayDayDu, str, tenNgan, tuoi, vnd } from '@/lib/format'
import { requireNhanVien } from '@/lib/session'
import { doiTrangThai } from '../lich-hen/actions'
import { khamVangLai } from '../phieu-dieu-tri/actions'

export const metadata = { title: 'Tiếp nhận' }

type LichHom = { id: number; gio_bat_dau: string; trang_thai: string; benh_nhan_id: number; ho_ten: string; bac_si: string; ghe: string; viec: string | null }

async function TiepNhanPage({ searchParams }: PageProps<'/tiep-nhan'>) {
  await requireNhanVien('le_tan')
  const sp = await searchParams
  const tim = str(sp.sdt)
  const chon = Number(str(sp.bn)) || 0
  const loc = str(sp.loc) || 'cho'
  const hom = homNay()

  const lich = await q<LichHom>(
    `SELECT lh.id, lh.gio_bat_dau, lh.trang_thai, lh.benh_nhan_id, bn.ho_ten, bs.ho_ten AS bac_si, g.ten AS ghe, dv.ten AS viec
     FROM lich_hen lh JOIN benh_nhan bn ON bn.id = lh.benh_nhan_id JOIN nhan_vien bs ON bs.id = lh.bac_si_id
     JOIN ghe g ON g.id = lh.ghe_id LEFT JOIN dich_vu dv ON dv.id = lh.dich_vu_id
     WHERE lh.ngay = $1 AND lh.trang_thai <> 'da_huy' ORDER BY lh.gio_bat_dau, g.id`,
    [hom],
  )
  const nhom = { cho: ['da_dat', 'da_nhac'], den: ['da_den'], xong: ['hoan_thanh', 'khong_den'] } as Record<string, string[]>
  const hien = loc === 'tat_ca' ? lich : lich.filter((l) => nhom[loc]?.includes(l.trang_thai))
  const ketQua = tim ? await timBenhNhan(tim, 10) : []
  const bnId = chon || (ketQua.find((b) => lich.some((l) => l.benh_nhan_id === b.id && ['da_dat', 'da_nhac'].includes(l.trang_thai)))?.id ?? ketQua[0]?.id)
  const bn = ketQua.find((b) => b.id === bnId)
  const lichBn = bn ? lich.filter((l) => l.benh_nhan_id === bn.id) : []
  const tomTat = bn
    ? (await q<{ con_no: number; lieu_trinh: string | null }>(
        `SELECT (SELECT coalesce(sum(con_no), 0) FROM v_cong_no_hoa_don WHERE benh_nhan_id = $1) AS con_no,
                (SELECT string_agg(ten || ' (' || so_buoi_da_lam || '/' || tong_so_buoi || ')', ', ') FROM v_lieu_trinh_dang_do WHERE benh_nhan_id = $1) AS lieu_trinh`,
        [bn.id],
      ))[0]
    : undefined
  const ca = await caTrucNgay(hom)
  const ghe = await q<{ id: number; ten: string }>('SELECT id, ten FROM ghe WHERE dang_hoat_dong ORDER BY id')
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
