import { Suspense } from 'react'
import { Skeleton } from '@/components/Skeleton'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ActionForm } from '@/components/ActionForm'
import { PrintButton } from '@/components/PrintButton'
import { Card, Empty, PageTitle } from '@/components/ui'
import { q, q1 } from '@/lib/db'
import { dsBacSi } from '@/lib/data'
import { ngayGio, so, tenNgan, vnd } from '@/lib/format'
import { requireNhanVien } from '@/lib/session'
import { giamGiaTong, suaGiamGia, themDong, thuTien, xoaDong } from '../actions'

type HD = {
  id: number
  ma_hoa_don: string
  benh_nhan_id: number
  ho_ten: string
  ma_ho_so: string
  sdt: string
  phieu_dieu_tri_id: number | null
  kham_luc: string | null
  nguoi_lap: string
  lap_luc: string
  ghi_chu: string | null
  tong_tien: number
  da_thu: number
  con_no: number
}

async function HoaDonChiTiet({ params }: PageProps<'/hoa-don/[id]'>) {
  const nv = await requireNhanVien('le_tan')
  const id = Number((await params).id)
  const hd = await q1<HD>(
    `SELECT hd.*, bn.ho_ten, bn.ma_ho_so, bn.sdt, p.kham_luc, nl.ho_ten AS nguoi_lap, cn.tong_tien, cn.da_thu, cn.con_no
     FROM hoa_don hd JOIN benh_nhan bn ON bn.id = hd.benh_nhan_id JOIN nhan_vien nl ON nl.id = hd.nguoi_lap_id
     JOIN v_cong_no_hoa_don cn ON cn.hoa_don_id = hd.id LEFT JOIN phieu_dieu_tri p ON p.id = hd.phieu_dieu_tri_id
     WHERE hd.id = $1`,
    [id],
  )
  if (!hd) notFound()
  const [dong, thu, dot, bacSi] = await Promise.all([
    q<{ id: number; mo_ta: string; so_luong: number; don_gia: number; giam_gia: number; thanh_tien: number; bac_si: string | null }>(
      `SELECT c.id, c.mo_ta, c.so_luong, c.don_gia, c.giam_gia, c.thanh_tien, bs.ho_ten AS bac_si
       FROM chi_tiet_hoa_don c LEFT JOIN nhan_vien bs ON bs.id = c.bac_si_id WHERE c.hoa_don_id = $1 ORDER BY c.id`,
      [id],
    ),
    q<{ id: number; so_tien: number; hinh_thuc: string; ma_giao_dich: string | null; thu_luc: string; nguoi: string }>(
      `SELECT t.id, t.so_tien, t.hinh_thuc, t.ma_giao_dich, t.thu_luc, nv.ho_ten AS nguoi
       FROM thanh_toan t JOIN nhan_vien nv ON nv.id = t.nguoi_thu_id WHERE t.hoa_don_id = $1 ORDER BY t.thu_luc`,
      [id],
    ),
    q<{ id: number; ten: string; dot_so: number; mo_ta: string | null; so_tien: number }>(
      `SELECT d.id, lt.ten, d.dot_so, d.mo_ta, d.so_tien FROM lieu_trinh_dot d JOIN lieu_trinh lt ON lt.id = d.lieu_trinh_id
       WHERE lt.benh_nhan_id = $1 AND NOT EXISTS (SELECT 1 FROM chi_tiet_hoa_don c WHERE c.lieu_trinh_dot_id = d.id)
       ORDER BY lt.id, d.dot_so`,
      [hd.benh_nhan_id],
    ),
    dsBacSi(),
  ])
  const tamTinh = dong.reduce((a, d) => a + Math.round(d.so_luong * d.don_gia), 0)
  const giam = dong.reduce((a, d) => a + d.giam_gia, 0)

  return (
    <>
      <PageTitle
        title={`Hóa đơn ${hd.ma_hoa_don}`}
        sub={`${hd.ho_ten} (${hd.ma_ho_so}) · ${hd.kham_luc ? `phiếu ${ngayGio(hd.kham_luc)}` : 'không gắn phiếu'} · lập bởi ${tenNgan(hd.nguoi_lap)} lúc ${ngayGio(hd.lap_luc)}`}
      >
        {hd.phieu_dieu_tri_id && <Link href={`/phieu-dieu-tri/${hd.phieu_dieu_tri_id}`} className="btn-sec print:hidden">Xem phiếu</Link>}
        <PrintButton />
      </PageTitle>

      <Card pad={false}>
        <table className="tbl">
          <thead>
            <tr><th>#</th><th>Mô tả</th><th>Bác sĩ</th><th className="num">SL</th><th className="num">Đơn giá</th><th className="num w-40">Giảm giá</th><th className="num">Thành tiền</th><th className="print:hidden" /></tr>
          </thead>
          <tbody>
            {dong.map((d, i) => (
              <tr key={d.id}>
                <td className="text-gray-500">{i + 1}</td>
                <td>{d.mo_ta}</td>
                <td>{d.bac_si ? tenNgan(d.bac_si, 'bac_si') : '—'}</td>
                <td className="num">{so(d.so_luong)}</td>
                <td className="num">{so(d.don_gia)}</td>
                <td className="num">
                  <ActionForm action={suaGiamGia} className="flex justify-end gap-1 print:hidden">
                    <input type="hidden" name="dong" value={d.id} />
                    <input type="hidden" name="hoa_don" value={hd.id} />
                    <input name="giam_gia" defaultValue={d.giam_gia} key={d.giam_gia} className="input h-7 w-24 text-right" />
                    <button className="btn-sec btn-sm" title="Lưu giảm giá">✓</button>
                  </ActionForm>
                  <span className="hidden print:inline">{so(d.giam_gia)}</span>
                </td>
                <td className="num font-medium">{so(d.thanh_tien)}</td>
                <td className="text-right print:hidden">
                  <ActionForm action={xoaDong} confirm="Xóa dòng này khỏi hóa đơn?">
                    <input type="hidden" name="dong" value={d.id} />
                    <input type="hidden" name="hoa_don" value={hd.id} />
                    <button className="text-gray-400 hover:text-red-600">✕</button>
                  </ActionForm>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {dong.length === 0 && <Empty>Hóa đơn chưa có dòng nào.</Empty>}
        <div className="grid grid-cols-2 gap-3 border-t border-gray-100 bg-gray-50 px-4 py-3 md:grid-cols-5">
          {[
            ['Tạm tính', vnd(tamTinh), ''],
            ['Giảm giá', `− ${vnd(giam)}`, ''],
            ['Tổng', vnd(hd.tong_tien), 'font-semibold'],
            ['Đã thu', vnd(hd.da_thu), 'text-emerald-700 font-semibold'],
            ['Còn nợ', vnd(hd.con_no), hd.con_no > 0 ? 'text-red-600 font-semibold' : 'font-semibold'],
          ].map(([a, b, c]) => (
            <div key={a}><div className="text-xs text-gray-500">{a}</div><div className={`text-lg tabular-nums ${c}`}>{b}</div></div>
          ))}
        </div>
        {hd.ghi_chu && <p className="border-t border-gray-100 px-4 py-2 text-xs whitespace-pre-line text-gray-600">{hd.ghi_chu}</p>}
      </Card>

      <div className="mt-4 grid gap-4 lg:grid-cols-3 print:hidden">
        <Card title="Thêm dòng">
          {dot.length > 0 && (
            <ActionForm action={themDong} className="mb-3 flex gap-2">
              <input type="hidden" name="hoa_don" value={hd.id} />
              <select name="dot" required className="input" defaultValue="">
                <option value="" disabled>+ Đợt liệu trình chưa thu</option>
                {dot.map((d) => <option key={d.id} value={d.id}>{d.ten} — đợt {d.dot_so}{d.mo_ta ? ` (${d.mo_ta})` : ''}: {vnd(d.so_tien)}</option>)}
              </select>
              <button className="btn-sec">Thêm</button>
            </ActionForm>
          )}
          <ActionForm action={themDong} className="grid grid-cols-3 gap-2" resetOnOk>
            <input type="hidden" name="hoa_don" value={hd.id} />
            <input name="mo_ta" placeholder="Mô tả dòng khác" className="input col-span-3" />
            <input name="so_luong" type="number" min={1} defaultValue={1} className="input" />
            <input name="don_gia" placeholder="Đơn giá" className="input col-span-2" />
            <select name="bs" className="input col-span-2" defaultValue="">
              <option value="">Không tính cho bác sĩ</option>
              {bacSi.map((b) => <option key={b.id} value={b.id}>{tenNgan(b.ho_ten, 'bac_si')}</option>)}
            </select>
            <button className="btn-sec">+ Dòng khác</button>
          </ActionForm>
        </Card>

        <Card title="Giảm giá cả hóa đơn" right="chia theo tỷ lệ xuống từng dòng">
          <ActionForm action={giamGiaTong} className="grid gap-2" resetOnOk>
            <input type="hidden" name="hoa_don" value={hd.id} />
            <input name="so_tien" placeholder="Số tiền giảm, VD 100000" className="input" />
            <input name="ly_do" placeholder="Lý do *, VD: khách quen" className="input" />
            <button className="btn-sec">Áp dụng</button>
            <p className="text-xs text-gray-500">Hóa đơn chỉ lưu giảm giá theo dòng (QĐ3), nên doanh thu từng bác sĩ vẫn đúng. Phần lẻ dồn vào dòng lớn nhất.</p>
          </ActionForm>
        </Card>

        <Card title="Thu tiền">
          {hd.con_no > 0 ? (
            <ActionForm action={thuTien} className="grid gap-2">
              <input type="hidden" name="hoa_don" value={hd.id} />
              <label><span className="label">Số tiền thu *</span><input name="so_tien" defaultValue={hd.con_no} key={hd.con_no} className="input h-10 text-right text-lg" /></label>
              <div className="flex gap-4 text-sm">
                <label className="flex items-center gap-1.5"><input type="radio" name="hinh_thuc" value="tien_mat" defaultChecked /> Tiền mặt</label>
                <label className="flex items-center gap-1.5"><input type="radio" name="hinh_thuc" value="chuyen_khoan" /> Chuyển khoản</label>
              </div>
              <input name="ma_gd" placeholder="Mã giao dịch (khi chuyển khoản)" className="input" />
              <button className="btn-primary h-10">Thu tiền</button>
            </ActionForm>
          ) : (
            <p className="text-sm font-medium text-emerald-700">Hóa đơn đã thanh toán đủ.</p>
          )}
          <div className="mt-3 border-t border-gray-100 pt-3">
            <div className="mb-1 text-xs font-semibold text-gray-500">Các lần thu ({thu.length})</div>
            {thu.length === 0 && <p className="text-sm text-gray-500">Chưa thu.</p>}
            {thu.map((t, i) => (
              <div key={t.id} className="flex justify-between text-sm">
                <span>{i + 1}. {ngayGio(t.thu_luc)} · {t.hinh_thuc === 'tien_mat' ? 'Tiền mặt' : `CK${t.ma_giao_dich ? ` ${t.ma_giao_dich}` : ''}`} · {tenNgan(t.nguoi)}</span>
                <span className="tabular-nums">{vnd(t.so_tien)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
      {nv.vai_tro === 'quan_ly' && <p className="mt-3 text-xs text-gray-400 print:hidden">Bạn đang xem với quyền quản lý.</p>}
    </>
  )
}

// Suspense nằm trong trang để cả lần tải đầu lẫn khi chuyển trang đều hiện khung chờ ngay (Cache Components).
export default function Page(props: PageProps<'/hoa-don/[id]'>) {
  return (
    <Suspense fallback={<Skeleton />}>
      <HoaDonChiTiet {...props} />
    </Suspense>
  )
}
