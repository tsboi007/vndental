import { Suspense } from 'react'
import { Skeleton } from '@/components/Skeleton'
import Link from 'next/link'

import { ActionForm } from '@/components/ActionForm'
import { Card, CanhBaoBN, Empty, PageTitle } from '@/components/ui'
import { ngayGio, so, tenNgan, tuoi } from '@/lib/format'
import { requireNhanVien } from '@/lib/session'
import { ghiVatTu, hoanTat, hoanThuoc, keThuoc, luuChanDoan, themViec, xoaViec } from '../actions'
import { trang } from '@/lib/api'

const VINH_VIEN = [[18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28], [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38]]
const RANG_SUA = [[55, 54, 53, 52, 51, 61, 62, 63, 64, 65], [85, 84, 83, 82, 81, 71, 72, 73, 74, 75]]

function SoDoRang({ phieuId, daGhi, chon }: { phieuId: number; daGhi: Set<number>; chon: number }) {
  const o = (r: number) => (
    <Link
      key={r}
      href={`/phieu-dieu-tri/${phieuId}?rang=${r}#them-viec`}
      scroll={false}
      className={`flex h-7 w-8 items-center justify-center rounded border text-[11px] tabular-nums ${
        r === chon ? 'border-brand bg-brand font-semibold text-white' : daGhi.has(r) ? 'border-brand bg-blue-100 font-semibold text-brand' : 'border-gray-300 bg-white hover:border-brand'
      }`}
    >
      {r}
    </Link>
  )
  const hang = (ds: number[], nua: number) => (
    <div className="flex justify-center gap-1">
      <div className="flex gap-1">{ds.slice(0, nua).map(o)}</div>
      <div className="w-px bg-gray-300" />
      <div className="flex gap-1">{ds.slice(nua).map(o)}</div>
    </div>
  )
  return (
    <div className="space-y-1.5 overflow-x-auto py-1">
      <div className="text-center text-[11px] text-gray-400">Hàm trên</div>
      {hang(VINH_VIEN[0], 8)}
      {hang(RANG_SUA[0], 5)}
      <div className="mx-auto h-px w-full max-w-[560px] bg-gray-200" />
      {hang(RANG_SUA[1], 5)}
      {hang(VINH_VIEN[1], 8)}
      <div className="text-center text-[11px] text-gray-400">Hàm dưới · FDI: 11–48 răng vĩnh viễn, 51–85 răng sữa</div>
    </div>
  )
}

async function PhieuChiTiet({ params, searchParams }: PageProps<'/phieu-dieu-tri/[id]'>) {
  const nv = await requireNhanVien('bac_si', 'le_tan')
  const { rangChon, p, sua, viec, thuoc, vatTuDung, lichSu, dichVu, bacSi, khoThuoc, khoVatTu, lieuTrinh } = await trang('phieu-dieu-tri-chi-tiet', { ...(await searchParams), ...(await params) })
  const daGhi = new Set(viec.map((v) => v.rang_so).filter((r): r is number => r != null))
  const tenDv = new Map(dichVu.map((d) => [d.id, d.ten]))
  const tenBs = new Map(bacSi.map((b) => [b.id, tenNgan(b.ho_ten, 'bac_si')]))

  const moTa = (l: (typeof lichSu)[number]) => {
    const d = (l.du_lieu_moi ?? l.du_lieu_cu ?? {}) as Record<string, unknown>
    const ten = l.bang === 'don_thuoc' ? 'thuốc' : l.bang === 'chi_tiet_dieu_tri' ? 'việc' : 'đầu phiếu'
    const tac = { INSERT: 'Thêm', UPDATE: 'Sửa', DELETE: 'Xóa' }[l.thao_tac]
    const nhan = l.bang === 'chi_tiet_dieu_tri' ? `${tenDv.get(Number(d.dich_vu_id)) ?? ''}${d.rang_so ? ` răng ${d.rang_so}` : ''}` : l.bang === 'don_thuoc' ? `${d.so_luong} · ${d.lieu_dung}` : ''
    const doi =
      l.thao_tac === 'UPDATE' && l.du_lieu_cu && l.du_lieu_moi
        ? Object.keys(l.du_lieu_moi)
            .filter((k) => JSON.stringify(l.du_lieu_cu![k]) !== JSON.stringify(l.du_lieu_moi![k]))
            .map((k) => `${k}: ${String(l.du_lieu_cu![k] ?? '∅')} → ${String(l.du_lieu_moi![k] ?? '∅')}`)
            .join('; ')
        : ''
    return { tieuDe: `${tac} ${ten}`, chiTiet: [nhan, doi, l.bang === 'chi_tiet_dieu_tri' && d.bac_si_thuc_hien_id ? `BS thực hiện: ${tenBs.get(Number(d.bac_si_thuc_hien_id)) ?? ''}` : ''].filter(Boolean).join(' · ') }
  }

  return (
    <>
      <PageTitle title={`Phiếu điều trị · ${p.ho_ten}`} sub={`${ngayGio(p.kham_luc)} · ${p.ghe} · BS chính: ${tenNgan(p.bac_si, 'bac_si')}${p.lich_hen_id ? ' · từ lịch hẹn' : ' · khám không hẹn'}`}>
        <Link href={`/benh-nhan/${p.benh_nhan_id}`} className="btn-sec">Hồ sơ bệnh nhân</Link>
        {p.hoa_don_id && <Link href={`/hoa-don/${p.hoa_don_id}`} className="btn-sec">Hóa đơn {p.ma_hoa_don}</Link>}
      </PageTitle>

      <div className="card mb-4 flex flex-wrap items-center justify-between gap-3 px-4 py-3">
        <div>
          <span className="font-semibold">{p.ho_ten}</span> <span className="text-gray-500">· {p.ma_ho_so}{p.ngay_sinh ? ` · ${tuoi(p.ngay_sinh)}` : ''} · {p.sdt}{p.sdt_la_cua ? ` (${p.sdt_la_cua.toLowerCase()})` : ''}</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <CanhBaoBN bn={p} />
          {p.trang_thai === 'hoan_tat'
            ? <span className="chip border-gray-300 bg-gray-100 text-gray-700">Hoàn tất {ngayGio(p.hoan_tat_luc)}</span>
            : <span className="chip border-amber-300 bg-amber-50 text-amber-900">Đang khám</span>}
        </div>
      </div>

      {p.hoa_don_id && <p className="msg-ok mb-4">Phiếu đã lập hóa đơn {p.ma_hoa_don}; phần việc và thuốc chỉ còn xem.</p>}

      <div className="grid gap-4 xl:grid-cols-[1fr_400px]">
        <div className="space-y-4">
          <Card title="Chẩn đoán">
            <ActionForm action={luuChanDoan} className="grid gap-2">
              <input type="hidden" name="phieu" value={p.id} />
              <textarea name="chan_doan" rows={2} defaultValue={p.chan_doan ?? ''} disabled={nv.vai_tro === 'le_tan'} className="input" placeholder="VD: sâu răng 55 mặt nhai; răng 84 lung lay độ 3" />
              <input name="ghi_chu" defaultValue={p.ghi_chu ?? ''} disabled={nv.vai_tro === 'le_tan'} className="input" placeholder="Ghi chú" />
              {nv.vai_tro !== 'le_tan' && <div className="text-right"><button className="btn-sec btn-sm">Lưu chẩn đoán</button></div>}
            </ActionForm>
          </Card>

          <Card title="Sơ đồ răng (FDI)" right={sua ? 'bấm vào răng để thêm việc cho răng đó' : undefined}>
            <SoDoRang phieuId={p.id} daGhi={daGhi} chon={rangChon} />
          </Card>

          <Card title="Việc đã làm" pad={false}>
            <table className="tbl">
              <thead><tr><th>Răng</th><th>Dịch vụ</th><th className="num">SL</th><th>BS thực hiện</th><th>Liệu trình</th><th>Ghi chú</th><th /></tr></thead>
              <tbody>
                {viec.map((v) => (
                  <tr key={v.id}>
                    <td className="tabular-nums">{v.rang_so ?? '—'}</td>
                    <td>{v.dich_vu}</td>
                    <td className="num">{so(v.so_luong)}</td>
                    <td>{tenNgan(v.bac_si, 'bac_si')}</td>
                    <td>{v.lieu_trinh ? `${v.lieu_trinh} · buổi ${v.buoi_thu}` : '—'}</td>
                    <td className="text-gray-600">{v.ghi_chu ?? ''}</td>
                    <td className="text-right">
                      {sua && (
                        <ActionForm action={xoaViec} confirm="Xóa việc này? Thao tác được ghi vào lịch sử sửa phiếu.">
                          <input type="hidden" name="id" value={v.id} />
                          <input type="hidden" name="phieu" value={p.id} />
                          <button className="text-gray-400 hover:text-red-600" title="Xóa">✕</button>
                        </ActionForm>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {viec.length === 0 && <Empty>Chưa ghi việc nào.</Empty>}
            {sua && (
              <div id="them-viec" className="border-t border-gray-100 p-4">
                <ActionForm action={themViec} className="grid grid-cols-2 gap-2 md:grid-cols-6" resetOnOk>
                  <input type="hidden" name="phieu" value={p.id} />
                  <label><span className="label">Răng</span><input name="rang" type="number" defaultValue={rangChon || ''} key={rangChon} placeholder="cả hàm" className="input" /></label>
                  <label className="col-span-2"><span className="label">Dịch vụ *</span>
                    <select name="dich_vu" required className="input" defaultValue="">
                      <option value="" disabled>— Chọn —</option>
                      {dichVu.map((d) => <option key={d.id} value={d.id}>{d.ten}</option>)}
                    </select>
                  </label>
                  <label><span className="label">SL</span><input name="so_luong" type="number" min={1} defaultValue={1} className="input" /></label>
                  <label className="col-span-2"><span className="label">BS thực hiện *</span>
                    <select name="bs" className="input" defaultValue={p.bac_si_chinh_id}>
                      {bacSi.map((b) => <option key={b.id} value={b.id}>{tenNgan(b.ho_ten, 'bac_si')}</option>)}
                    </select>
                  </label>
                  {lieuTrinh.length > 0 && (
                    <>
                      <label className="col-span-2"><span className="label">Thuộc liệu trình</span>
                        <select name="lieu_trinh" className="input" defaultValue="">
                          <option value="">— Không —</option>
                          {lieuTrinh.map((l) => <option key={l.lieu_trinh_id} value={l.lieu_trinh_id}>{l.ten}</option>)}
                        </select>
                      </label>
                      <label><span className="label">Buổi thứ</span><input name="buoi_thu" type="number" min={1} defaultValue={(lieuTrinh[0]?.so_buoi_da_lam ?? 0) + 1} className="input" /></label>
                    </>
                  )}
                  <label className={lieuTrinh.length ? 'col-span-2' : 'col-span-4'}><span className="label">Ghi chú</span><input name="ghi_chu" className="input" /></label>
                  <div className="flex items-end"><button className="btn-primary w-full">+ Thêm việc</button></div>
                </ActionForm>
              </div>
            )}
          </Card>

          <Card title={`Lịch sử sửa phiếu (${lichSu.length})`} right="chỉ đọc — không ai sửa hay xóa được">
            {lichSu.length === 0 ? <p className="text-sm text-gray-500">Chưa có thay đổi.</p> : (
              <ol className="space-y-2 text-sm">
                {lichSu.map((l) => {
                  const m = moTa(l)
                  return (
                    <li key={l.id} className="border-l-2 border-brand/40 pl-3">
                      <div className="text-xs text-gray-500">{ngayGio(l.sua_luc)} · {l.ai ? tenNgan(l.ai, l.vai_tro ?? undefined) : 'hệ thống'}</div>
                      <div><b>{m.tieuDe}</b>{m.chiTiet ? ` — ${m.chiTiet}` : ''}</div>
                    </li>
                  )
                })}
              </ol>
            )}
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Đơn thuốc" pad={false}>
            <table className="tbl">
              <thead><tr><th>Thuốc</th><th>Liều dùng</th><th className="num">SL</th><th /></tr></thead>
              <tbody>
                {thuoc.map((t) => (
                  <tr key={t.id} className={t.da_hoan ? 'text-gray-400 line-through' : ''}>
                    <td>{t.ten}</td>
                    <td className="text-gray-600">{t.lieu_dung}</td>
                    <td className="num">{so(t.so_luong)} {t.don_vi}</td>
                    <td className="text-right">
                      {t.da_hoan ? <span className="chip border-gray-300 bg-gray-50 text-gray-500 no-underline">đã hoàn kho</span> : sua && (
                        <ActionForm action={hoanThuoc} confirm="Hủy kê thuốc này? Kho được hoàn bằng một giao dịch điều chỉnh; dòng đơn thuốc vẫn lưu để đối chiếu.">
                          <input type="hidden" name="id" value={t.id} />
                          <input type="hidden" name="phieu" value={p.id} />
                          <button className="text-xs text-gray-400 hover:text-red-600" title="Hủy kê, hoàn kho">Hoàn kho</button>
                        </ActionForm>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {thuoc.length === 0 && <Empty>Không kê thuốc.</Empty>}
            {sua && (
              <ActionForm action={keThuoc} className="grid grid-cols-3 gap-2 border-t border-gray-100 p-4" resetOnOk>
                <input type="hidden" name="phieu" value={p.id} />
                <select name="thuoc" required className="input col-span-2" defaultValue="">
                  <option value="" disabled>— Chọn thuốc —</option>
                  {khoThuoc.map((t) => <option key={t.id} value={t.id}>{t.ten} (tồn {so(t.ton_kho)} {t.don_vi})</option>)}
                </select>
                <input name="so_luong" type="number" min={1} defaultValue={10} className="input" />
                <input name="lieu_dung" required placeholder="Liều dùng, VD: ngày 2 lần, mỗi lần 1 viên sau ăn" className="input col-span-3" />
                <button className="btn-sec col-span-3">+ Kê thuốc (trừ kho)</button>
              </ActionForm>
            )}
          </Card>

          <Card title="Vật tư đã dùng" pad={false}>
            <table className="tbl">
              <thead><tr><th>Vật tư</th><th className="num">SL</th><th>Cho việc</th></tr></thead>
              <tbody>
                {vatTuDung.map((v, i) => (
                  <tr key={i}><td>{v.ten}</td><td className="num">{so(v.so_luong)} {v.don_vi}</td><td>{v.viec}</td></tr>
                ))}
              </tbody>
            </table>
            {vatTuDung.length === 0 && <Empty>Chưa ghi vật tư.</Empty>}
            {nv.vai_tro !== 'le_tan' && viec.length > 0 && (
              <ActionForm action={ghiVatTu} className="grid grid-cols-3 gap-2 border-t border-gray-100 p-4" resetOnOk>
                <select name="vat_tu" required className="input col-span-2" defaultValue="">
                  <option value="" disabled>— Vật tư —</option>
                  {khoVatTu.map((t) => <option key={t.id} value={t.id}>{t.ten} (tồn {so(t.ton_kho)} {t.don_vi})</option>)}
                </select>
                <input name="so_luong" type="number" min={1} defaultValue={1} className="input" />
                <select name="viec" required className="input col-span-3" defaultValue="">
                  <option value="" disabled>— Dùng cho việc —</option>
                  {viec.map((v) => <option key={v.id} value={v.id}>{v.dich_vu}{v.rang_so ? ` răng ${v.rang_so}` : ''}</option>)}
                </select>
                <button className="btn-sec col-span-3">+ Ghi vật tư (trừ kho)</button>
              </ActionForm>
            )}
          </Card>

          {nv.vai_tro !== 'le_tan' && (
            <Card title="Kết thúc buổi khám">
              <div className="space-y-2">
                <Link href={`/lich-hen/dat?bn=${p.benh_nhan_id}&bs=${p.bac_si_chinh_id}`} className="btn-sec w-full">Hẹn buổi sau</Link>
                {p.trang_thai === 'dang_kham' ? (
                  <ActionForm action={hoanTat}>
                    <input type="hidden" name="phieu" value={p.id} />
                    <button className="btn-primary w-full">Hoàn tất &amp; chuyển thu tiền</button>
                  </ActionForm>
                ) : (
                  <p className="text-center text-sm text-gray-500">{p.hoa_don_id ? `Đã lập hóa đơn ${p.ma_hoa_don}.` : 'Đã chuyển lễ tân thu tiền.'}</p>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}

// Suspense nằm trong trang để cả lần tải đầu lẫn khi chuyển trang đều hiện khung chờ ngay (Cache Components).
export default function Page(props: PageProps<'/phieu-dieu-tri/[id]'>) {
  return (
    <Suspense fallback={<Skeleton />}>
      <PhieuChiTiet {...props} />
    </Suspense>
  )
}
