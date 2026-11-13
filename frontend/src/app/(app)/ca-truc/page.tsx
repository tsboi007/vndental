import { Suspense } from 'react'
import { Skeleton } from '@/components/Skeleton'
import Link from 'next/link'
import { ActionForm } from '@/components/ActionForm'
import { Card, PageTitle } from '@/components/ui'
import { trongCa } from '@/lib/data'
import { BUOI, congNgay, gio, homNay, khungTrongNgay, ngay, tenNgan, thuNgan, VAI_TRO } from '@/lib/format'
import { requireNhanVien } from '@/lib/session'
import { saoChepTuanTruoc, themCa, xoaCa } from './actions'
import { trang } from '@/lib/api'

export const metadata = { title: 'Ca trực' }

// Gộp các khung liền nhau thành khoảng 'HH:MM–HH:MM'
function khoang(ds: string[]): string[] {
  const out: string[] = []
  let dau = ''
  let truoc = ''
  const sau = (k: string) => { const [h, m] = k.split(':').map(Number); return `${String(h + (m ? 1 : 0)).padStart(2, '0')}:${m ? '00' : '30'}` }
  for (const k of ds) {
    if (dau && sau(truoc) === k) { truoc = k; continue }
    if (dau) out.push(`${dau}–${sau(truoc)}`)
    dau = k
    truoc = k
  }
  if (dau) out.push(`${dau}–${sau(truoc)}`)
  return out
}

async function CaTrucPage({ searchParams }: PageProps<'/ca-truc'>) {
  await requireNhanVien('quan_ly')
  const { tuan, ngayTuan, nhanVien, ca } = await trang('ca-truc', await searchParams)
  const thieu = ngayTuan.map((d) => khoang(khungTrongNgay(d).filter((k) => !ca.some((c) => c.ngay === d && c.vai_tro === 'bac_si' && trongCa(c, k)))))

  return (
    <>
      <PageTitle title="Xếp ca trực" sub="Lịch hẹn chỉ đặt được vào khung có bác sĩ trực (L11)">
        <Link href={`/ca-truc?tuan=${congNgay(tuan, -7)}`} className="btn-sec">‹</Link>
        <span className="text-sm font-semibold">Tuần {ngay(tuan).slice(0, 5)} – {ngay(ngayTuan[6])}</span>
        <Link href={`/ca-truc?tuan=${congNgay(tuan, 7)}`} className="btn-sec">›</Link>
        <ActionForm action={saoChepTuanTruoc} confirm="Chép toàn bộ ca của tuần trước sang tuần này?">
          <input type="hidden" name="tuan" value={tuan} />
          <button className="btn-sec">Sao chép tuần trước</button>
        </ActionForm>
      </PageTitle>
      <div className="card overflow-x-auto">
        <table className="w-full min-w-[960px] table-fixed border-collapse text-sm">
          <thead>
            <tr>
              <th className="w-48 border-b border-gray-200 bg-gray-50 px-3 py-2 text-left text-xs font-semibold text-gray-600">Nhân viên</th>
              {ngayTuan.map((d) => (
                <th key={d} className={`border-b border-l border-gray-200 px-2 py-2 text-xs font-semibold ${d === homNay() ? 'bg-brand-50 text-brand' : 'bg-gray-50 text-gray-600'}`}>
                  {thuNgan(d)} {ngay(d).slice(0, 5)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {nhanVien.map((v) => {
              const soNgay = new Set(ca.filter((c) => c.nhan_vien_id === v.id).map((c) => c.ngay)).size
              return (
                <tr key={v.id}>
                  <td className="border-b border-gray-100 px-3 py-2">
                    <div className="font-semibold">{tenNgan(v.ho_ten, v.vai_tro)}</div>
                    <div className="text-xs text-gray-500">{VAI_TRO[v.vai_tro]}{v.ban_thoi_gian ? ` · bán thời gian ${soNgay}/3 ngày` : ''}</div>
                  </td>
                  {ngayTuan.map((d) => (
                    <td key={d} className="border-b border-l border-gray-100 p-1.5 align-top">
                      {ca.filter((c) => c.nhan_vien_id === v.id && c.ngay === d).map((c) => (
                        <ActionForm key={c.id} action={xoaCa} confirm={`Xóa ca ${gio(c.gio_bat_dau)}–${gio(c.gio_ket_thuc)} ngày ${ngay(d)}?`} className="mb-1">
                          <input type="hidden" name="id" value={c.id} />
                          <button
                            title="Bấm để bỏ ca"
                            className={`group flex w-full items-center justify-between rounded-full border px-2.5 py-1 text-xs font-semibold ${v.vai_tro === 'bac_si' ? 'border-blue-300 bg-blue-50 text-blue-900' : 'border-gray-300 bg-gray-50 text-gray-700'}`}
                          >
                            {BUOI[c.buoi]} {gio(c.gio_bat_dau)}–{gio(c.gio_ket_thuc)}
                            <span className="text-transparent group-hover:text-red-600">✕</span>
                          </button>
                        </ActionForm>
                      ))}
                    </td>
                  ))}
                </tr>
              )
            })}
            <tr>
              <td className="bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">Khung không có bác sĩ</td>
              {thieu.map((t, i) => (
                <td key={i} className={`border-l border-gray-100 px-2 py-2 text-xs ${t.length ? 'bg-amber-50 text-amber-800' : 'text-emerald-700'}`}>
                  {t.length ? t.map((x) => <div key={x}>⚠ {x}</div>) : '✓ đủ'}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
      <Card title="Thêm ca" className="mt-4 max-w-3xl">
        <ActionForm action={themCa} className="grid grid-cols-2 gap-3 sm:grid-cols-6">
          <label className="col-span-2"><span className="label">Nhân viên</span>
            <select name="nv" required className="input" defaultValue="">
              <option value="" disabled>— Chọn —</option>
              {nhanVien.map((v) => <option key={v.id} value={v.id}>{tenNgan(v.ho_ten, v.vai_tro)}</option>)}
            </select>
          </label>
          <label><span className="label">Ngày</span><input type="date" name="ngay" defaultValue={tuan} required className="input" /></label>
          <label><span className="label">Buổi</span>
            <select name="buoi" required className="input" defaultValue="sang">
              <option value="sang">Sáng</option>
              <option value="chieu">Chiều</option>
            </select>
          </label>
          <label><span className="label">Từ (để trống = giờ chuẩn)</span><input type="time" name="tu" step={1800} className="input" /></label>
          <label><span className="label">Đến</span><input type="time" name="den" step={1800} className="input" /></label>
          <div className="col-span-2 flex items-end justify-end sm:col-span-4"><button className="btn-primary">Lưu ca</button></div>
        </ActionForm>
        <p className="mt-2 text-xs text-gray-500">
          Giờ chuẩn (G12): sáng 08:00–14:00, chiều 14:00–20:00; Chủ nhật 08:00–12:30 / 12:30–17:00. CSDL chặn ca trùng buổi,
          ca chồng giờ của cùng một người và ca ngoài giờ mở cửa. Không bỏ được ca đang có lịch hẹn.
        </p>
      </Card>
    </>
  )
}

// Suspense nằm trong trang để cả lần tải đầu lẫn khi chuyển trang đều hiện khung chờ ngay (Cache Components).
export default function Page(props: PageProps<'/ca-truc'>) {
  return (
    <Suspense fallback={<Skeleton />}>
      <CaTrucPage {...props} />
    </Suspense>
  )
}
