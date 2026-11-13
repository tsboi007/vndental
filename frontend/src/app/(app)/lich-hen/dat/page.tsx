import { Suspense } from 'react'
import { Skeleton } from '@/components/Skeleton'
import Link from 'next/link'
import { ActionForm } from '@/components/ActionForm'
import { Card, DiUng, PageTitle } from '@/components/ui'
import { trang } from '@/lib/api'
import { trongCa } from '@/lib/data'
import { gio, homNay, khungTrongNgay, ngay as fmtNgay, ngayDayDu, str, tenNgan, tuoi, vnd } from '@/lib/format'
import { requireNhanVien } from '@/lib/session'
import { datLich } from '../actions'

export const metadata = { title: 'Đặt lịch hẹn' }

async function DatLichPage({ searchParams }: PageProps<'/lich-hen/dat'>) {
  await requireNhanVien('le_tan', 'bac_si')
  const sp = await searchParams
  const p = {
    tim: str(sp.tim),
    bn: str(sp.bn),
    bs: str(sp.bs),
    ngay: str(sp.ngay) || homNay(),
    gio: str(sp.gio),
    ghe: str(sp.ghe),
    dv: str(sp.dv),
    doi: str(sp.doi), // đang dời lịch: id lịch cũ đã hủy (P5)
  }
  const link = (o: Partial<typeof p>) => {
    const u = new URLSearchParams(Object.entries({ ...p, ...o }).filter(([, v]) => v) as [string, string][])
    return `/lich-hen/dat?${u}`
  }

  const { bn, ketQua, tomTat, lieuTrinh, ca, lich, ghe, dichVu } = await trang('lich-hen-dat', sp)
  const bacSiTruc = [...new Map(ca.map((c) => [String(c.nhan_vien_id), c.ho_ten])).entries()]
  const caBs = ca.filter((c) => String(c.nhan_vien_id) === p.bs)
  const bayGio = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Ho_Chi_Minh', hour: '2-digit', minute: '2-digit' }).format(new Date())
  const daQua = (k: string) => p.ngay < homNay() || (p.ngay === homNay() && k <= bayGio)
  const khung = khungTrongNgay(p.ngay).filter((k) => caBs.some((c) => trongCa(c, k)))
  const bsBan = (k: string) => lich.some((l) => String(l.bac_si_id) === p.bs && gio(l.gio_bat_dau) === k)
  const gheBan = (k: string, g: number) => lich.some((l) => l.ghe_id === g && gio(l.gio_bat_dau) === k)
  const gioHopLe = p.gio && khung.includes(p.gio) && !bsBan(p.gio) && !daQua(p.gio)
  const gheHopLe = gioHopLe && p.ghe && !gheBan(p.gio, Number(p.ghe))

  return (
    <>
      <PageTitle title="Đặt lịch hẹn" sub="Một lịch = một bác sĩ + một ghế + một khung 30 phút">
        <Link href={`/lich-hen?ngay=${p.ngay}`} className="btn-sec">← Về lịch hẹn</Link>
      </PageTitle>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="1. Bệnh nhân">
          {bn ? (
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-semibold">{bn.ho_ten} <span className="font-normal text-gray-500">· {bn.ma_ho_so}</span></div>
                <div className="text-sm text-gray-600">
                  {bn.ngay_sinh ? `${fmtNgay(bn.ngay_sinh)} (${tuoi(bn.ngay_sinh)})` : 'Chưa có ngày sinh'} · {bn.sdt}
                  {bn.sdt_la_cua ? ` (số của ${bn.sdt_la_cua.toLowerCase()})` : ''}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  Lần khám gần nhất: {tomTat?.lan_cuoi ? fmtNgay(tomTat.lan_cuoi) : 'chưa có'} · Lịch sắp tới:{' '}
                  {tomTat?.sap_toi ? `${fmtNgay(tomTat.sap_toi)} ${gio(tomTat.sap_toi.slice(11))}` : 'không có'} · Còn nợ: {vnd(tomTat?.con_no)}
                </div>
                <div className="mt-1 flex flex-wrap gap-1"><DiUng text={bn.di_ung && `Dị ứng: ${bn.di_ung}`} /><DiUng text={bn.tien_su_benh} /></div>
              </div>
              <Link href={link({ bn: '', tim: bn.sdt })} className="btn-sec btn-sm">Đổi</Link>
            </div>
          ) : (
            <>
              <form className="flex gap-2">
                {Object.entries(p).filter(([k, v]) => v && k !== 'tim').map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
                <input name="tim" defaultValue={p.tim} placeholder="Số điện thoại, mã hồ sơ hoặc họ tên" className="input" autoFocus />
                <button className="btn-sec">Tìm</button>
              </form>
              {p.tim && (
                <div className="mt-3 space-y-1.5">
                  <p className="text-xs text-gray-500">
                    {ketQua.length ? `Tìm thấy ${ketQua.length} hồ sơ — chọn đúng người:` : 'Không tìm thấy hồ sơ nào.'}
                  </p>
                  {ketQua.map((r) => (
                    <Link key={r.id} href={link({ bn: String(r.id), tim: '' })} className="flex justify-between rounded-md border border-gray-200 px-3 py-2 text-sm hover:border-brand hover:bg-brand-50">
                      <span className="font-medium">{r.ho_ten}</span>
                      <span className="text-gray-500">
                        {r.ngay_sinh ? `${fmtNgay(r.ngay_sinh)} · ` : ''}{r.ma_ho_so} · {r.sdt_la_cua ? `số của ${r.sdt_la_cua.toLowerCase()}` : 'chủ số'}
                      </span>
                    </Link>
                  ))}
                  <Link href={`/benh-nhan/moi?sdt=${encodeURIComponent(p.tim)}&tiep=dat_lich`} className="link inline-block text-sm">
                    + Tạo hồ sơ mới
                  </Link>
                </div>
              )}
            </>
          )}
        </Card>

        <Card title="2. Bác sĩ và ngày">
          <form className="grid grid-cols-2 gap-3">
            {Object.entries(p).filter(([k, v]) => v && !['bs', 'ngay', 'gio', 'ghe'].includes(k)).map(([k, v]) => <input key={k} type="hidden" name={k} value={v} />)}
            <label>
              <span className="label">Ngày</span>
              <input type="date" name="ngay" defaultValue={p.ngay} min={homNay()} className="input" />
            </label>
            <label>
              <span className="label">Bác sĩ (đang trực ngày đã chọn)</span>
              <select name="bs" defaultValue={p.bs} className="input">
                <option value="">— Chọn bác sĩ —</option>
                {bacSiTruc.map(([id, ten]) => <option key={id} value={id}>{tenNgan(ten, 'bac_si')}</option>)}
              </select>
            </label>
            <div className="col-span-2 flex items-center justify-between">
              <span className="text-xs text-gray-500">{bacSiTruc.length ? `${ngayDayDu(p.ngay)}: ${bacSiTruc.length} bác sĩ trực` : 'Ngày này chưa có bác sĩ trực.'}</span>
              <button className="btn-sec">Xem khung trống</button>
            </div>
          </form>
        </Card>
      </div>

      {p.bs && (
        <Card
          className="mt-4"
          title={`3. Khung giờ — ${tenNgan(bacSiTruc.find(([id]) => id === p.bs)?.[1] ?? '', 'bac_si')} trực ${caBs.map((c) => `${gio(c.gio_bat_dau)}–${gio(c.gio_ket_thuc)}`).join(', ') || '(không trực)'}`}
        >
          {khung.length === 0 && <p className="text-sm text-gray-500">Bác sĩ không trực ngày này. Chọn bác sĩ hoặc ngày khác.</p>}
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-9">
            {khung.map((k) => {
              const ban = bsBan(k) || daQua(k)
              const chon = k === p.gio
              return ban ? (
                <span key={k} className="rounded-md border border-gray-200 bg-gray-100 py-1.5 text-center text-sm text-gray-400">{k} · {daQua(k) ? 'đã qua' : 'bận'}</span>
              ) : (
                <Link key={k} href={link({ gio: k })} className={`rounded-md border py-1.5 text-center text-sm ${chon ? 'border-brand bg-brand font-semibold text-white' : 'border-gray-300 hover:border-brand'}`}>{k}</Link>
              )
            })}
          </div>
          {gioHopLe && (
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="text-sm text-gray-600">Ghế lúc {p.gio}:</span>
              {ghe.map((g) =>
                gheBan(p.gio, g.id) ? (
                  <span key={g.id} className="rounded-md border border-gray-200 bg-gray-100 px-3 py-1.5 text-sm text-gray-400">{g.ten} · đã có lịch</span>
                ) : (
                  <Link key={g.id} href={link({ ghe: String(g.id) })} className={`rounded-md border px-3 py-1.5 text-sm ${String(g.id) === p.ghe ? 'border-brand bg-brand-50 font-semibold text-brand' : 'border-gray-300 hover:border-brand'}`}>{g.ten}</Link>
                ),
              )}
            </div>
          )}
        </Card>
      )}

      {bn && gheHopLe && (
        <Card className="mt-4" title="4. Xác nhận">
          <ActionForm action={datLich} className="grid gap-3 md:grid-cols-2">
            {(['bs', 'ngay', 'gio', 'ghe'] as const).map((k) => <input key={k} type="hidden" name={k} value={p[k]} />)}
            <input type="hidden" name="bn" value={bn.id} />
            {p.doi && <input type="hidden" name="doi" value={p.doi} />}
            {p.doi && (
              <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 md:col-span-2">
                Đang dời lịch: lịch cũ đã hủy với lý do &quot;Dời sang lịch khác&quot;; lịch mới sẽ được liên kết với lịch cũ.
              </p>
            )}
            <label>
              <span className="label">Việc cần làm</span>
              <select name="dich_vu" defaultValue={p.dv} className="input">
                <option value="">— Chưa xác định —</option>
                {dichVu.map((d) => <option key={d.id} value={d.id}>{d.ten}</option>)}
              </select>
            </label>
            <label>
              <span className="label">Ghi chú cho bác sĩ</span>
              <input name="noi_dung" className="input" placeholder="VD: đau răng hàm dưới bên trái" />
            </label>
            {lieuTrinh.length > 0 && (
              <>
                <label>
                  <span className="label">Thuộc liệu trình</span>
                  <select name="lieu_trinh" className="input">
                    <option value="">— Không —</option>
                    {lieuTrinh.map((l) => <option key={l.lieu_trinh_id} value={l.lieu_trinh_id}>{l.ten} ({l.so_buoi_da_lam}/{l.tong_so_buoi} buổi)</option>)}
                  </select>
                </label>
                <label>
                  <span className="label">Buổi thứ</span>
                  <input name="buoi_thu" type="number" min={1} defaultValue={(lieuTrinh[0]?.so_buoi_da_lam ?? 0) + 1} className="input" />
                </label>
              </>
            )}
            <div className="flex items-center justify-between rounded-md bg-gray-50 px-3 py-2 md:col-span-2">
              <div className="text-sm">
                <b>{bn.ho_ten}</b> · {ngayDayDu(p.ngay)} · {p.gio} · {ghe.find((g) => String(g.id) === p.ghe)?.ten} ·{' '}
                {tenNgan(bacSiTruc.find(([id]) => id === p.bs)?.[1] ?? '', 'bac_si')}
              </div>
              <button className="btn-primary">Lưu lịch hẹn</button>
            </div>
          </ActionForm>
        </Card>
      )}
      {!bn && p.bs && gheHopLe && <p className="mt-4 text-sm text-amber-700">Chọn bệnh nhân ở bước 1 để lưu lịch hẹn.</p>}
    </>
  )
}

// Suspense nằm trong trang để cả lần tải đầu lẫn khi chuyển trang đều hiện khung chờ ngay (Cache Components).
export default function Page(props: PageProps<'/lich-hen/dat'>) {
  return (
    <Suspense fallback={<Skeleton />}>
      <DatLichPage {...props} />
    </Suspense>
  )
}
