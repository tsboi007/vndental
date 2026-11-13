import { Suspense } from 'react'
import { Skeleton } from '@/components/Skeleton'
import Link from 'next/link'
import { ActionForm } from '@/components/ActionForm'
import { Card, PageTitle } from '@/components/ui'
import { batBuoc, run, n, s, type ActionState } from '@/lib/action'
import { q, tx } from '@/lib/db'
import { congNgay, homNay, ngay, so, str, tenNgan, vnd } from '@/lib/format'
import { requireNhanVien } from '@/lib/session'

export const metadata = { title: 'Bảng giá' }

// L5: không ghi đè giá cũ. Giá đang mở (không có ngày kết thúc) được đóng lại vào ngày giá mới bắt đầu.
async function datGiaMoi(_: ActionState, fd: FormData): Promise<ActionState> {
  'use server'
  const nv = await requireNhanVien('quan_ly')
  return run(async () => {
    const gia = n(fd, 'don_gia')
    const tu = s(fd, 'tu')
    if (!(gia >= 0)) throw new Error('Đơn giá không hợp lệ.')
    batBuoc([tu, 'ngày áp dụng'])
    await tx(nv.id, async (c) => {
      const sau = await c.query<{ hieu_luc_tu: string }>('SELECT hieu_luc_tu FROM bang_gia WHERE dich_vu_id = $1 AND hieu_luc_tu >= $2', [n(fd, 'dv'), tu])
      if (sau.rowCount) throw new Error(`Đã có mức giá áp dụng từ ${ngay(sau.rows[0].hieu_luc_tu)}. Chọn ngày sau đó.`)
      await c.query('UPDATE bang_gia SET hieu_luc_den = $2 WHERE dich_vu_id = $1 AND hieu_luc_den IS NULL', [n(fd, 'dv'), tu])
      await c.query('INSERT INTO bang_gia (dich_vu_id, don_gia, hieu_luc_tu, nguoi_cap_nhat) VALUES ($1, $2, $3, $4)', [n(fd, 'dv'), gia, tu, nv.id])
    })
    return `Đã đặt giá ${vnd(gia)} từ ${ngay(tu)}.`
  })
}

async function themDichVu(_: ActionState, fd: FormData): Promise<ActionState> {
  'use server'
  const nv = await requireNhanVien('quan_ly')
  return run(async () => {
    batBuoc([s(fd, 'ma'), 'mã'], [s(fd, 'ten'), 'tên dịch vụ'])
    const gia = n(fd, 'don_gia')
    if (!(gia >= 0)) throw new Error('Đơn giá không hợp lệ.')
    await tx(nv.id, async (c) => {
      const r = await c.query<{ id: number }>('INSERT INTO dich_vu (ma, ten, don_vi) VALUES ($1, $2, $3) RETURNING id', [s(fd, 'ma').toUpperCase(), s(fd, 'ten'), s(fd, 'don_vi') || 'lần'])
      await c.query('INSERT INTO bang_gia (dich_vu_id, don_gia, hieu_luc_tu, nguoi_cap_nhat) VALUES ($1, $2, current_date, $3)', [r.rows[0].id, gia, nv.id])
    })
    return 'Đã thêm dịch vụ.'
  })
}

async function BangGiaPage({ searchParams }: PageProps<'/bang-gia'>) {
  await requireNhanVien('quan_ly')
  const chon = Number(str((await searchParams).dv)) || 0
  const ds = await q<{ id: number; ma: string; ten: string; don_vi: string; gia: number | null; tu: string | null }>(
    `SELECT dv.id, dv.ma, dv.ten, dv.don_vi, bg.don_gia AS gia, bg.hieu_luc_tu AS tu FROM dich_vu dv
     LEFT JOIN bang_gia bg ON bg.dich_vu_id = dv.id AND daterange(bg.hieu_luc_tu, bg.hieu_luc_den, '[)') @> current_date
     WHERE dv.dang_ap_dung ORDER BY dv.id`,
  )
  const dv = ds.find((d) => d.id === chon) ?? ds[0]
  const lichSu = dv
    ? await q<{ don_gia: number; hieu_luc_tu: string; hieu_luc_den: string | null; nguoi: string | null }>(
        `SELECT bg.don_gia, bg.hieu_luc_tu, bg.hieu_luc_den, nv.ho_ten AS nguoi FROM bang_gia bg LEFT JOIN nhan_vien nv ON nv.id = bg.nguoi_cap_nhat
         WHERE bg.dich_vu_id = $1 ORDER BY bg.hieu_luc_tu DESC`,
        [dv.id],
      )
    : []
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
