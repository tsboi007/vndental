import { Suspense } from 'react'
import { Skeleton } from '@/components/Skeleton'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ActionForm } from '@/components/ActionForm'
import { Bar, Card, Empty, PageTitle } from '@/components/ui'
import { q, q1 } from '@/lib/db'
import { LOAI_LIEU_TRINH, ngay, ngayGio, tenNgan, vnd } from '@/lib/format'
import { requireNhanVien } from '@/lib/session'
import { capNhatLieuTrinh, suaDot, themDot } from '../actions'

async function LieuTrinhChiTiet({ params }: PageProps<'/lieu-trinh/[id]'>) {
  const nv = await requireNhanVien('bac_si', 'le_tan')
  const id = Number((await params).id)
  const lt = await q1<{ id: number; ten: string; loai: string; trang_thai: string; tong_so_buoi: number; tong_chi_phi: number; ngay_bat_dau: string; ghi_chu: string | null; benh_nhan_id: number; ho_ten: string; bac_si_id: number; bac_si: string }>(
    `SELECT lt.*, bn.ho_ten, bs.id AS bac_si_id, bs.ho_ten AS bac_si FROM lieu_trinh lt JOIN benh_nhan bn ON bn.id = lt.benh_nhan_id
     JOIN nhan_vien bs ON bs.id = lt.bac_si_phu_trach_id WHERE lt.id = $1`,
    [id],
  )
  if (!lt) notFound()
  const [dot, buoi, hen] = await Promise.all([
    q<{ id: number; dot_so: number; so_tien: number; mo_ta: string | null; ma_hoa_don: string | null; hoa_don_id: number | null; con_no: number | null }>(
      `SELECT d.id, d.dot_so, d.so_tien, d.mo_ta, hd.ma_hoa_don, hd.id AS hoa_don_id, cn.con_no
       FROM lieu_trinh_dot d LEFT JOIN chi_tiet_hoa_don c ON c.lieu_trinh_dot_id = d.id LEFT JOIN hoa_don hd ON hd.id = c.hoa_don_id
       LEFT JOIN v_cong_no_hoa_don cn ON cn.hoa_don_id = hd.id WHERE d.lieu_trinh_id = $1 ORDER BY d.dot_so`,
      [id],
    ),
    q<{ phieu_id: number; kham_luc: string; buoi_thu: number; bac_si: string; viec: string; ghi_chu: string | null }>(
      `SELECT p.id AS phieu_id, p.kham_luc, min(ct.buoi_thu) AS buoi_thu, bs.ho_ten AS bac_si,
              string_agg(dv.ten || coalesce(' ' || ct.rang_so, ''), ' · ') AS viec, p.ghi_chu
       FROM chi_tiet_dieu_tri ct JOIN phieu_dieu_tri p ON p.id = ct.phieu_id JOIN dich_vu dv ON dv.id = ct.dich_vu_id
       JOIN nhan_vien bs ON bs.id = p.bac_si_chinh_id WHERE ct.lieu_trinh_id = $1 GROUP BY p.id, bs.id ORDER BY p.kham_luc`,
      [id],
    ),
    q<{ id: number; ngay: string; gio_bat_dau: string; buoi_thu: number }>(
      "SELECT id, ngay, gio_bat_dau, buoi_thu FROM lich_hen WHERE lieu_trinh_id = $1 AND trang_thai IN ('da_dat','da_nhac') ORDER BY ngay",
      [id],
    ),
  ])
  const tongDot = dot.reduce((a, d) => a + d.so_tien, 0)
  const laBs = nv.vai_tro !== 'le_tan'

  return (
    <>
      <PageTitle title={lt.ten} sub={`${LOAI_LIEU_TRINH[lt.loai]} · ${lt.ho_ten} · ${tenNgan(lt.bac_si, 'bac_si')} phụ trách · bắt đầu ${ngay(lt.ngay_bat_dau)}`}>
        <Link href={`/benh-nhan/${lt.benh_nhan_id}`} className="btn-sec">Hồ sơ bệnh nhân</Link>
        <Link href={`/lich-hen/dat?bn=${lt.benh_nhan_id}&bs=${lt.bac_si_id}`} className="btn-primary">Hẹn buổi tiếp theo</Link>
      </PageTitle>
      <div className="grid gap-4 xl:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <Card title="Các đợt thanh toán" right={tongDot === lt.tong_chi_phi ? 'Tổng các đợt = tổng chi phí ✓' : `⚠ Tổng các đợt ${vnd(tongDot)} ≠ tổng chi phí ${vnd(lt.tong_chi_phi)}`} pad={false}>
            <table className="tbl">
              <thead><tr><th>Đợt</th><th>Mô tả</th><th className="num">Số tiền</th><th>Hóa đơn</th><th /></tr></thead>
              <tbody>
                {dot.map((d) => (
                  <tr key={d.id}>
                    <td>{d.dot_so}</td>
                    {d.hoa_don_id ? (
                      <>
                        <td>{d.mo_ta ?? '—'}</td>
                        <td className="num">{vnd(d.so_tien)}</td>
                        <td><Link href={`/hoa-don/${d.hoa_don_id}`} className="link">{d.ma_hoa_don}</Link> {d.con_no ? <span className="text-red-600">· còn nợ {vnd(d.con_no)}</span> : <span className="text-emerald-700">· đã thu đủ</span>}</td>
                        <td />
                      </>
                    ) : (
                      <td colSpan={4}>
                        <ActionForm action={suaDot} className="flex items-center gap-2">
                          <input type="hidden" name="dot" value={d.id} />
                          <input name="mo_ta" defaultValue={d.mo_ta ?? ''} placeholder="Mô tả" className="input h-8" />
                          <input name="so_tien" defaultValue={d.so_tien} className="input h-8 w-36 text-right" />
                          <span className="text-xs whitespace-nowrap text-gray-500">chưa lập HĐ</span>
                          <button className="btn-sec btn-sm">Lưu</button>
                        </ActionForm>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
            {dot.length === 0 && <Empty>Chưa có đợt nào.</Empty>}
            <ActionForm action={themDot} className="flex gap-2 border-t border-gray-100 p-4" resetOnOk>
              <input type="hidden" name="id" value={lt.id} />
              <input name="mo_ta" placeholder="Mô tả đợt mới" className="input" />
              <input name="so_tien" placeholder="Số tiền" className="input w-40" />
              <button className="btn-sec">+ Thêm đợt</button>
            </ActionForm>
            <p className="px-4 pb-3 text-xs text-gray-500">Khi đến đợt, lễ tân thêm dòng “đợt liệu trình” vào hóa đơn. Mỗi đợt chỉ lập hóa đơn một lần.</p>
          </Card>

          <Card title={`Các buổi đã làm (${buoi.length})`} pad={false}>
            <table className="tbl">
              <thead><tr><th>Buổi</th><th>Ngày</th><th>Bác sĩ</th><th>Việc</th><th>Ghi chú</th></tr></thead>
              <tbody>
                {buoi.map((b) => (
                  <tr key={b.phieu_id}>
                    <td>{b.buoi_thu}</td>
                    <td><Link href={`/phieu-dieu-tri/${b.phieu_id}`} className="link">{ngayGio(b.kham_luc)}</Link></td>
                    <td>{tenNgan(b.bac_si, 'bac_si')}</td>
                    <td>{b.viec}</td>
                    <td className="text-gray-600">{b.ghi_chu ?? ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {buoi.length === 0 && <Empty>Chưa làm buổi nào.</Empty>}
          </Card>
        </div>

        <div className="space-y-4">
          <Card title="Tiến độ">
            <div className="text-2xl font-semibold">{buoi.length} / {lt.tong_so_buoi} buổi</div>
            <div className="my-2"><Bar pct={buoi.length / lt.tong_so_buoi} /></div>
            <div className="text-sm text-gray-600">Còn {Math.max(0, lt.tong_so_buoi - buoi.length)} buổi</div>
            <div className="mt-3 border-t border-gray-100 pt-3 text-sm">
              <div className="mb-1 text-xs font-semibold text-gray-500">Lịch hẹn sắp tới</div>
              {hen.length === 0 ? <p className="text-gray-500">Chưa hẹn.</p> : hen.map((h) => (
                <Link key={h.id} href={`/lich-hen/${h.id}`} className="link block">Buổi {h.buoi_thu} · {ngay(h.ngay)} {h.gio_bat_dau.slice(0, 5)}</Link>
              ))}
            </div>
          </Card>
          {laBs && (
            <Card title="Cập nhật">
              <ActionForm action={capNhatLieuTrinh} className="grid gap-2">
                <input type="hidden" name="id" value={lt.id} />
                <label><span className="label">Trạng thái</span>
                  <select name="trang_thai" defaultValue={lt.trang_thai} className="input">
                    <option value="dang_lam">Đang làm</option><option value="hoan_thanh">Hoàn thành</option><option value="da_dung">Đã dừng</option>
                  </select>
                </label>
                <label><span className="label">Tổng số buổi</span><input name="tong_so_buoi" type="number" min={1} defaultValue={lt.tong_so_buoi} className="input" /></label>
                <label><span className="label">Ghi chú</span><textarea name="ghi_chu" rows={2} defaultValue={lt.ghi_chu ?? ''} className="input" /></label>
                <button className="btn-sec">Lưu</button>
              </ActionForm>
            </Card>
          )}
        </div>
      </div>
    </>
  )
}

// Suspense nằm trong trang để cả lần tải đầu lẫn khi chuyển trang đều hiện khung chờ ngay (Cache Components).
export default function Page(props: PageProps<'/lieu-trinh/[id]'>) {
  return (
    <Suspense fallback={<Skeleton />}>
      <LieuTrinhChiTiet {...props} />
    </Suspense>
  )
}
