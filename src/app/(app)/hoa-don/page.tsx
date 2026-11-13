import { Suspense } from 'react'
import { Skeleton } from '@/components/Skeleton'
import Link from 'next/link'
import { ActionForm } from '@/components/ActionForm'
import { Card, Empty, PageTitle } from '@/components/ui'
import { q } from '@/lib/db'
import { chiSo } from '@/lib/data'
import { ngayGio, str, tenNgan, vnd } from '@/lib/format'
import { requireNhanVien } from '@/lib/session'
import { lapHoaDon } from './actions'

export const metadata = { title: 'Hóa đơn & thu tiền' }

async function HoaDonPage({ searchParams }: PageProps<'/hoa-don'>) {
  await requireNhanVien('le_tan')
  const tim = str((await searchParams).q).trim()

  // Chờ thanh toán: phiếu bác sĩ đã bấm hoàn tất, có việc lẻ hoặc thuốc, chưa có hóa đơn.
  // Buổi thuộc liệu trình không tính giá từng buổi (G11) — thu theo đợt ở màn Liệu trình.
  const cho = await q<{ id: number; kham_luc: string; ho_ten: string; bac_si: string; viec: string | null }>(
    `SELECT p.id, p.kham_luc, bn.ho_ten, bs.ho_ten AS bac_si,
            (SELECT string_agg(dv.ten || coalesce(' ' || ct.rang_so, ''), ' · ') FROM chi_tiet_dieu_tri ct JOIN dich_vu dv ON dv.id = ct.dich_vu_id WHERE ct.phieu_id = p.id) AS viec
     FROM phieu_dieu_tri p JOIN benh_nhan bn ON bn.id = p.benh_nhan_id JOIN nhan_vien bs ON bs.id = p.bac_si_chinh_id
     WHERE NOT EXISTS (SELECT 1 FROM hoa_don WHERE phieu_dieu_tri_id = p.id)
       AND (EXISTS (SELECT 1 FROM chi_tiet_dieu_tri WHERE phieu_id = p.id AND lieu_trinh_id IS NULL) OR EXISTS (SELECT 1 FROM don_thuoc WHERE phieu_id = p.id))
       AND p.trang_thai = 'hoan_tat'
       AND p.kham_luc > now() - interval '30 days'
     ORDER BY p.kham_luc`,
  )
  type Dong = { hoa_don_id: number; ma_hoa_don: string; lap_luc: string; ho_ten: string; sdt: string; tong_tien: number; da_thu: number; con_no: number }
  const chon = 'SELECT cn.*, bn.ho_ten, bn.sdt FROM v_cong_no_hoa_don cn JOIN benh_nhan bn ON bn.id = cn.benh_nhan_id'
  const ds = tim
    ? await q<Dong>(
        `${chon} WHERE cn.ma_hoa_don ILIKE $1 OR ($2 <> '' AND bn.sdt LIKE $2 || '%') OR bn.ho_ten ILIKE '%' || $1 || '%'
         ORDER BY cn.lap_luc DESC LIMIT 50`,
        [tim, chiSo(tim)],
      )
    : await q<Dong>(`${chon} WHERE cn.lap_luc::date = current_date ORDER BY cn.lap_luc DESC`)

  return (
    <>
      <PageTitle title="Hóa đơn & thu tiền" sub="Giá lấy theo bảng giá ngày khám và được chốt vào hóa đơn">
        <form className="flex gap-2">
          <input name="q" defaultValue={tim} placeholder="Mã HĐ, SĐT hoặc tên bệnh nhân" className="input w-72" />
          <button className="btn-sec">Tìm</button>
        </form>
      </PageTitle>
      <div className="grid gap-4 xl:grid-cols-[380px_1fr]">
        <Card title={`Chờ thanh toán (${cho.length})`} pad={false}>
          <ul className="divide-y divide-gray-100">
            {cho.map((p) => (
              <li key={p.id} className="flex items-center justify-between gap-2 px-4 py-2.5">
                <div className="min-w-0">
                  <div className="font-medium">{p.ho_ten}</div>
                  <div className="truncate text-xs text-gray-500">{tenNgan(p.bac_si, 'bac_si')} · {ngayGio(p.kham_luc)} · {p.viec ?? 'thuốc'}</div>
                </div>
                <ActionForm action={lapHoaDon}>
                  <input type="hidden" name="phieu" value={p.id} />
                  <button className="btn-primary btn-sm">Lập hóa đơn</button>
                </ActionForm>
              </li>
            ))}
          </ul>
          {cho.length === 0 && <Empty>Không có phiếu chờ.</Empty>}
        </Card>
        <Card title={tim ? `Kết quả tìm "${tim}"` : 'Hóa đơn lập hôm nay'} pad={false}>
          <table className="tbl">
            <thead><tr><th>Mã</th><th>Lập lúc</th><th>Bệnh nhân</th><th className="num">Tổng</th><th className="num">Đã thu</th><th className="num">Còn nợ</th></tr></thead>
            <tbody>
              {ds.map((h) => (
                <tr key={h.hoa_don_id}>
                  <td><Link href={`/hoa-don/${h.hoa_don_id}`} className="link">{h.ma_hoa_don}</Link></td>
                  <td>{ngayGio(h.lap_luc)}</td>
                  <td>{h.ho_ten}</td>
                  <td className="num">{vnd(h.tong_tien)}</td>
                  <td className="num">{vnd(h.da_thu)}</td>
                  <td className={`num ${h.con_no > 0 ? 'font-semibold text-red-600' : ''}`}>{vnd(h.con_no)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {ds.length === 0 && <Empty>Không có hóa đơn.</Empty>}
        </Card>
      </div>
    </>
  )
}

// Suspense nằm trong trang để cả lần tải đầu lẫn khi chuyển trang đều hiện khung chờ ngay (Cache Components).
export default function Page(props: PageProps<'/hoa-don'>) {
  return (
    <Suspense fallback={<Skeleton />}>
      <HoaDonPage {...props} />
    </Suspense>
  )
}
