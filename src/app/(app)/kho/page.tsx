import { Suspense } from 'react'
import { Skeleton } from '@/components/Skeleton'
import Link from 'next/link'
import { ActionForm } from '@/components/ActionForm'
import { Bar, Card, Empty, PageTitle, Tabs } from '@/components/ui'
import { batBuoc, run, n, s, type ActionState } from '@/lib/action'
import { q, tx } from '@/lib/db'
import { LOAI_GIAO_DICH, ngayGio, so, str, tenNgan } from '@/lib/format'
import { requireNhanVien } from '@/lib/session'

export const metadata = { title: 'Kho thuốc & vật tư' }

async function giaoDich(_: ActionState, fd: FormData): Promise<ActionState> {
  'use server'
  const nv = await requireNhanVien('quan_ly')
  return run(async () => {
    const loai = s(fd, 'loai')
    const sl = n(fd, 'so_luong')
    if (loai === 'nhap' && !(sl > 0)) throw new Error('Số lượng nhập phải lớn hơn 0.')
    if (loai === 'dieu_chinh') {
      if (!sl) throw new Error('Nhập số lượng điều chỉnh (âm để giảm, dương để tăng).')
      batBuoc([s(fd, 'ghi_chu'), 'lý do điều chỉnh'])
    }
    await tx(nv.id, (c) =>
      c.query('INSERT INTO giao_dich_kho (vat_tu_id, loai, so_luong, nhan_vien_id, ghi_chu) VALUES ($1, $2, $3, $4, $5)', [
        n(fd, 'vt'), loai, sl, nv.id, s(fd, 'ghi_chu') || null,
      ]),
    )
    return loai === 'nhap' ? 'Đã nhập kho.' : 'Đã điều chỉnh tồn.'
  })
}

async function datNguong(_: ActionState, fd: FormData): Promise<ActionState> {
  'use server'
  const nv = await requireNhanVien('quan_ly')
  return run(async () => {
    await tx(nv.id, (c) =>
      c.query('UPDATE vat_tu SET nguong_dat_them = $2, gia_ban = $3 WHERE id = $1', [n(fd, 'vt'), n(fd, 'nguong') || 0, s(fd, 'gia_ban') ? n(fd, 'gia_ban') : null]),
    )
    return 'Đã lưu.'
  })
}

async function themVatTu(_: ActionState, fd: FormData): Promise<ActionState> {
  'use server'
  const nv = await requireNhanVien('quan_ly')
  return run(async () => {
    batBuoc([s(fd, 'ma'), 'mã'], [s(fd, 'ten'), 'tên'], [s(fd, 'don_vi'), 'đơn vị'])
    await tx(nv.id, (c) =>
      c.query('INSERT INTO vat_tu (ma, ten, loai, don_vi, nguong_dat_them, gia_ban) VALUES ($1, $2, $3, $4, $5, $6)', [
        s(fd, 'ma').toUpperCase(), s(fd, 'ten'), s(fd, 'loai'), s(fd, 'don_vi'), n(fd, 'nguong') || 0, s(fd, 'gia_ban') ? n(fd, 'gia_ban') : null,
      ]),
    )
    return 'Đã thêm.'
  })
}

async function KhoPage({ searchParams }: PageProps<'/kho'>) {
  await requireNhanVien('quan_ly')
  const sp = await searchParams
  const loc = str(sp.loc) || 'tat_ca'
  const ds = await q<{ id: number; ma: string; ten: string; loai: string; don_vi: string; ton_kho: number; nguong_dat_them: number; gia_ban: number | null }>(
    'SELECT * FROM vat_tu WHERE dang_su_dung ORDER BY (ton_kho <= nguong_dat_them) DESC, loai, ten',
  )
  const sapHet = ds.filter((v) => v.ton_kho <= v.nguong_dat_them)
  const hien = loc === 'sap_het' ? sapHet : loc === 'tat_ca' ? ds : ds.filter((v) => v.loai === loc)
  const chon = ds.find((v) => v.id === Number(str(sp.vt))) ?? hien[0]
  const lichSu = chon
    ? await q<{ thoi_diem: string; loai: string; so_luong: number; ghi_chu: string | null; ai: string | null; viec: string | null; benh_nhan: string | null }>(
        `SELECT gd.thoi_diem, gd.loai, gd.so_luong, gd.ghi_chu, nv.ho_ten AS ai,
                dv.ten || coalesce(' ' || ct.rang_so, '') AS viec, coalesce(bn.ho_ten, bn2.ho_ten) AS benh_nhan
         FROM giao_dich_kho gd LEFT JOIN nhan_vien nv ON nv.id = gd.nhan_vien_id
         LEFT JOIN chi_tiet_dieu_tri ct ON ct.id = gd.chi_tiet_dieu_tri_id LEFT JOIN dich_vu dv ON dv.id = ct.dich_vu_id
         LEFT JOIN phieu_dieu_tri p ON p.id = ct.phieu_id LEFT JOIN benh_nhan bn ON bn.id = p.benh_nhan_id
         LEFT JOIN don_thuoc dt ON dt.id = gd.don_thuoc_id LEFT JOIN phieu_dieu_tri p2 ON p2.id = dt.phieu_id LEFT JOIN benh_nhan bn2 ON bn2.id = p2.benh_nhan_id
         WHERE gd.vat_tu_id = $1 ORDER BY gd.thoi_diem DESC, gd.id DESC LIMIT 15`,
        [chon.id],
      )
    : []
  const tab = (k: string, l: string) => ({ href: `/kho?loc=${k}`, label: l, active: loc === k })

  return (
    <>
      <PageTitle title="Kho thuốc & vật tư" sub="Mọi thay đổi tồn kho đều là một giao dịch: nhập, xuất dùng, xuất kê đơn, điều chỉnh" />
      <Tabs items={[tab('tat_ca', `Tất cả (${ds.length})`), tab('thuoc', `Thuốc (${ds.filter((v) => v.loai === 'thuoc').length})`), tab('vat_tu', `Vật tư (${ds.filter((v) => v.loai === 'vat_tu').length})`), tab('sap_het', `⚠ Sắp hết (${sapHet.length})`)]} />
      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <div className="card overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Mã</th><th>Tên</th><th>Loại</th><th className="num">Tồn / ngưỡng</th><th className="w-36">Mức tồn</th><th className="num">Giá bán</th></tr></thead>
              <tbody>
                {hien.map((v) => {
                  const pct = v.nguong_dat_them ? v.ton_kho / (v.nguong_dat_them * 3) : 1
                  const het = v.ton_kho <= v.nguong_dat_them
                  return (
                    <tr key={v.id} className={v.id === chon?.id ? 'bg-brand-50' : v.ton_kho === 0 ? 'bg-red-50' : ''}>
                      <td className="text-gray-500">{v.ma}</td>
                      <td><Link href={`/kho?loc=${loc}&vt=${v.id}`} className="link">{v.ten}</Link></td>
                      <td>{v.loai === 'thuoc' ? 'Thuốc' : 'Vật tư'}</td>
                      <td className={`num ${het ? 'font-semibold text-red-600' : ''}`}>{so(v.ton_kho)} / {so(v.nguong_dat_them)} {v.don_vi}</td>
                      <td><Bar pct={pct} tone={v.ton_kho === 0 ? 'red' : het ? 'amber' : 'green'} /></td>
                      <td className="num">{v.gia_ban == null ? '—' : so(v.gia_ban)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {hien.length === 0 && <Empty>Không có mục nào.</Empty>}
          </div>
          {chon && (
            <Card title={`Biến động gần đây · ${chon.ten}`} pad={false}>
              <table className="tbl">
                <thead><tr><th>Thời điểm</th><th>Loại</th><th className="num">SL</th><th>Chi tiết</th></tr></thead>
                <tbody>
                  {lichSu.map((l, i) => (
                    <tr key={i}>
                      <td>{ngayGio(l.thoi_diem)}</td>
                      <td>{LOAI_GIAO_DICH[l.loai]}</td>
                      <td className={`num ${l.so_luong < 0 ? 'text-red-600' : 'text-emerald-700'}`}>{l.so_luong > 0 ? '+' : ''}{so(l.so_luong)}</td>
                      <td className="text-gray-600">{[l.viec, l.benh_nhan, l.ghi_chu, l.ai && tenNgan(l.ai)].filter(Boolean).join(' · ')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {lichSu.length === 0 && <Empty>Chưa có giao dịch.</Empty>}
            </Card>
          )}
        </div>
        <div className="space-y-4">
          {chon && (
            <Card title={`${chon.ten} · tồn ${so(chon.ton_kho)} ${chon.don_vi}`}>
              <ActionForm action={giaoDich} className="grid grid-cols-2 gap-2" resetOnOk>
                <input type="hidden" name="vt" value={chon.id} />
                <input type="hidden" name="loai" value="nhap" />
                <label><span className="label">Nhập thêm *</span><input name="so_luong" type="number" min={1} required className="input" /></label>
                <label><span className="label">Số phiếu / NCC</span><input name="ghi_chu" className="input" /></label>
                <button className="btn-primary col-span-2">Lưu phiếu nhập</button>
              </ActionForm>
              <details className="mt-3 border-t border-gray-100 pt-3">
                <summary className="cursor-pointer text-sm font-medium text-brand">Điều chỉnh tồn (kiểm kê, hỏng)…</summary>
                <ActionForm action={giaoDich} className="mt-2 grid grid-cols-2 gap-2" resetOnOk>
                  <input type="hidden" name="vt" value={chon.id} />
                  <input type="hidden" name="loai" value="dieu_chinh" />
                  <input name="so_luong" type="number" placeholder="+/− số lượng" className="input" />
                  <input name="ghi_chu" placeholder="Lý do *" className="input" />
                  <button className="btn-sec col-span-2">Lưu điều chỉnh</button>
                </ActionForm>
              </details>
              <details className="mt-3 border-t border-gray-100 pt-3">
                <summary className="cursor-pointer text-sm font-medium text-brand">Ngưỡng cảnh báo &amp; giá bán…</summary>
                <ActionForm action={datNguong} className="mt-2 grid grid-cols-2 gap-2">
                  <input type="hidden" name="vt" value={chon.id} />
                  <label><span className="label">Ngưỡng đặt thêm</span><input name="nguong" defaultValue={chon.nguong_dat_them} className="input" /></label>
                  <label><span className="label">Giá bán (để trống nếu không bán)</span><input name="gia_ban" defaultValue={chon.gia_ban ?? ''} className="input" /></label>
                  <button className="btn-sec col-span-2">Lưu</button>
                </ActionForm>
              </details>
            </Card>
          )}
          <Card title="Thêm thuốc / vật tư">
            <ActionForm action={themVatTu} className="grid grid-cols-2 gap-2" resetOnOk>
              <input name="ma" placeholder="Mã *" className="input" />
              <select name="loai" className="input"><option value="thuoc">Thuốc</option><option value="vat_tu">Vật tư</option></select>
              <input name="ten" placeholder="Tên *" className="input col-span-2" />
              <input name="don_vi" placeholder="Đơn vị * (viên, hộp…)" className="input" />
              <input name="nguong" placeholder="Ngưỡng đặt thêm" className="input" />
              <input name="gia_ban" placeholder="Giá bán (thuốc)" className="input" />
              <button className="btn-sec">Thêm</button>
            </ActionForm>
          </Card>
        </div>
      </div>
    </>
  )
}

// Suspense nằm trong trang để cả lần tải đầu lẫn khi chuyển trang đều hiện khung chờ ngay (Cache Components).
export default function Page(props: PageProps<'/kho'>) {
  return (
    <Suspense fallback={<Skeleton />}>
      <KhoPage {...props} />
    </Suspense>
  )
}
