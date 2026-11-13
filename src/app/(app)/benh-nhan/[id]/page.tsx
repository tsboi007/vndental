import { Suspense } from 'react'
import { Skeleton } from '@/components/Skeleton'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ActionForm } from '@/components/ActionForm'
import { Bar, Card, CanhBaoBN, Empty, PageTitle, Tabs, TrangThai } from '@/components/ui'
import { q, q1 } from '@/lib/db'
import type { BenhNhan } from '@/lib/data'
import { gio, ngay, ngayGio, str, tenNgan, tuoi, vnd } from '@/lib/format'
import { requireNhanVien } from '@/lib/session'
import { capNhatBenhNhan } from '../actions'

async function HoSoBenhNhan({ params, searchParams }: PageProps<'/benh-nhan/[id]'>) {
  await requireNhanVien('le_tan', 'bac_si')
  const id = Number((await params).id)
  const tab = str((await searchParams).tab) || 'kham'
  const bn = await q1<BenhNhan>('SELECT * FROM benh_nhan WHERE id = $1', [id])
  if (!bn) notFound()

  const [kham, lich, hoaDon, lieuTrinh] = await Promise.all([
    q<{ id: number; kham_luc: string; bac_si: string; viec: string | null; ma_hoa_don: string | null; hoa_don_id: number | null; con_no: number | null }>(
      `SELECT p.id, p.kham_luc, bs.ho_ten AS bac_si,
              (SELECT string_agg(dv.ten || coalesce(' ' || ct.rang_so, '') || coalesce(' (buổi ' || ct.buoi_thu || ')', ''), ' · ' ORDER BY ct.id)
               FROM chi_tiet_dieu_tri ct JOIN dich_vu dv ON dv.id = ct.dich_vu_id WHERE ct.phieu_id = p.id) AS viec,
              hd.ma_hoa_don, hd.id AS hoa_don_id, cn.con_no
       FROM phieu_dieu_tri p JOIN nhan_vien bs ON bs.id = p.bac_si_chinh_id
       LEFT JOIN hoa_don hd ON hd.phieu_dieu_tri_id = p.id LEFT JOIN v_cong_no_hoa_don cn ON cn.hoa_don_id = hd.id
       WHERE p.benh_nhan_id = $1 ORDER BY p.kham_luc DESC`,
      [id],
    ),
    q<{ id: number; ngay: string; gio_bat_dau: string; trang_thai: string; bac_si: string; viec: string | null }>(
      `SELECT lh.id, lh.ngay, lh.gio_bat_dau, lh.trang_thai, bs.ho_ten AS bac_si, dv.ten AS viec
       FROM lich_hen lh JOIN nhan_vien bs ON bs.id = lh.bac_si_id LEFT JOIN dich_vu dv ON dv.id = lh.dich_vu_id
       WHERE lh.benh_nhan_id = $1 ORDER BY lh.ngay DESC, lh.gio_bat_dau DESC`,
      [id],
    ),
    q<{ hoa_don_id: number; ma_hoa_don: string; lap_luc: string; tong_tien: number; da_thu: number; con_no: number }>(
      'SELECT * FROM v_cong_no_hoa_don WHERE benh_nhan_id = $1 ORDER BY lap_luc DESC',
      [id],
    ),
    q<{ id: number; ten: string; trang_thai: string; tong_so_buoi: number; tong_chi_phi: number; bac_si: string; ngay_bat_dau: string; da_lam: number; da_thu: number }>(
      `SELECT lt.id, lt.ten, lt.trang_thai, lt.tong_so_buoi, lt.tong_chi_phi, bs.ho_ten AS bac_si, lt.ngay_bat_dau,
              (SELECT count(DISTINCT phieu_id) FROM chi_tiet_dieu_tri WHERE lieu_trinh_id = lt.id) AS da_lam,
              (SELECT coalesce(sum(least(cthd.thanh_tien, cn.da_thu)), 0) FROM lieu_trinh_dot d
                 JOIN chi_tiet_hoa_don cthd ON cthd.lieu_trinh_dot_id = d.id JOIN v_cong_no_hoa_don cn ON cn.hoa_don_id = cthd.hoa_don_id
                 WHERE d.lieu_trinh_id = lt.id) AS da_thu
       FROM lieu_trinh lt JOIN nhan_vien bs ON bs.id = lt.bac_si_phu_trach_id WHERE lt.benh_nhan_id = $1 ORDER BY lt.ngay_bat_dau DESC`,
      [id],
    ),
  ])
  const tongNo = hoaDon.reduce((a, h) => a + Math.max(0, h.con_no), 0)
  const sapToi = lich.filter((l) => ['da_dat', 'da_nhac'].includes(l.trang_thai)).reverse()
  const t = (k: string, label: string) => ({ href: `/benh-nhan/${id}?tab=${k}`, label, active: tab === k })

  return (
    <>
      <PageTitle
        title={bn.ho_ten}
        sub={`${bn.ma_ho_so} · ${bn.gioi_tinh === 'M' ? 'Nam' : bn.gioi_tinh === 'F' ? 'Nữ' : '—'} · ${bn.ngay_sinh ? `${ngay(bn.ngay_sinh)} (${tuoi(bn.ngay_sinh)})` : 'chưa có ngày sinh'} · ${bn.sdt}${bn.sdt_la_cua ? ` (của ${bn.sdt_la_cua.toLowerCase()}: ${bn.ten_nguoi_giam_ho ?? ''})` : ' (chính chủ)'}`}
      >
        <Link href={`/lich-hen/dat?bn=${bn.id}`} className="btn-primary">Đặt lịch</Link>
        <Link href={`/lieu-trinh/moi?bn=${bn.id}`} className="btn-sec">Mở liệu trình</Link>
      </PageTitle>
      <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-gray-600">
        <CanhBaoBN bn={bn} trong />
        {bn.ma_ho_so_giay && <span>Hồ sơ giấy: {bn.ma_ho_so_giay}</span>}
        {bn.dia_chi && <span>· {bn.dia_chi}</span>}
        <span>· Tạo hồ sơ {ngay(bn.tao_luc)}</span>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
        <div>
          <Tabs items={[t('kham', `Lịch sử khám (${kham.length})`), t('lich', `Lịch hẹn (${lich.length})`), t('hoa-don', `Hóa đơn (${hoaDon.length})`), t('sua', 'Sửa thông tin')]} />
          {tab === 'kham' && (
            <div className="card overflow-x-auto">
              <table className="tbl">
                <thead><tr><th>Ngày</th><th>Bác sĩ</th><th>Việc đã làm</th><th>Hóa đơn</th><th className="num">Còn nợ</th></tr></thead>
                <tbody>
                  {kham.map((k) => (
                    <tr key={k.id}>
                      <td><Link href={`/phieu-dieu-tri/${k.id}`} className="link">{ngayGio(k.kham_luc)}</Link></td>
                      <td>{tenNgan(k.bac_si, 'bac_si')}</td>
                      <td>{k.viec ?? '—'}</td>
                      <td>{k.hoa_don_id ? <Link href={`/hoa-don/${k.hoa_don_id}`} className="link">{k.ma_hoa_don}</Link> : <span className="text-amber-700">Chưa lập</span>}</td>
                      <td className={`num ${k.con_no ? 'text-red-600' : ''}`}>{k.hoa_don_id ? vnd(k.con_no) : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {kham.length === 0 && <Empty>Chưa có lần khám nào.</Empty>}
            </div>
          )}
          {tab === 'lich' && (
            <div className="card overflow-x-auto">
              <table className="tbl">
                <thead><tr><th>Ngày</th><th>Giờ</th><th>Bác sĩ</th><th>Việc</th><th>Trạng thái</th></tr></thead>
                <tbody>
                  {lich.map((l) => (
                    <tr key={l.id}>
                      <td><Link href={`/lich-hen/${l.id}`} className="link">{ngay(l.ngay)}</Link></td>
                      <td>{gio(l.gio_bat_dau)}</td>
                      <td>{tenNgan(l.bac_si, 'bac_si')}</td>
                      <td>{l.viec ?? '—'}</td>
                      <td><TrangThai tt={l.trang_thai} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {lich.length === 0 && <Empty>Chưa có lịch hẹn.</Empty>}
            </div>
          )}
          {tab === 'hoa-don' && (
            <div className="card overflow-x-auto">
              <table className="tbl">
                <thead><tr><th>Mã</th><th>Ngày lập</th><th className="num">Tổng</th><th className="num">Đã thu</th><th className="num">Còn nợ</th></tr></thead>
                <tbody>
                  {hoaDon.map((h) => (
                    <tr key={h.hoa_don_id}>
                      <td><Link href={`/hoa-don/${h.hoa_don_id}`} className="link">{h.ma_hoa_don}</Link></td>
                      <td>{ngayGio(h.lap_luc)}</td>
                      <td className="num">{vnd(h.tong_tien)}</td>
                      <td className="num">{vnd(h.da_thu)}</td>
                      <td className={`num ${h.con_no > 0 ? 'font-semibold text-red-600' : ''}`}>{vnd(h.con_no)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {hoaDon.length === 0 && <Empty>Chưa có hóa đơn.</Empty>}
            </div>
          )}
          {tab === 'sua' && (
            <Card>
              <ActionForm action={capNhatBenhNhan} className="grid gap-3 sm:grid-cols-6">
                <input type="hidden" name="id" value={bn.id} />
                <label className="sm:col-span-3"><span className="label">Họ tên *</span><input name="ho_ten" defaultValue={bn.ho_ten} required className="input" /></label>
                <label className="sm:col-span-2"><span className="label">Ngày sinh</span><input type="date" name="ngay_sinh" defaultValue={bn.ngay_sinh ?? ''} className="input" /></label>
                <label><span className="label">Giới tính</span>
                  <select name="gioi_tinh" defaultValue={bn.gioi_tinh ?? ''} className="input"><option value="">—</option><option value="M">Nam</option><option value="F">Nữ</option></select>
                </label>
                <label className="sm:col-span-2"><span className="label">Số điện thoại *</span><input name="sdt" defaultValue={bn.sdt} required className="input" /></label>
                <label className="sm:col-span-2"><span className="label">Số này là của (để trống nếu chính chủ)</span><input name="sdt_la_cua" defaultValue={bn.sdt_la_cua ?? ''} placeholder="Mẹ, Bố…" className="input" /></label>
                <label className="sm:col-span-2"><span className="label">Tên người giám hộ</span><input name="ten_giam_ho" defaultValue={bn.ten_nguoi_giam_ho ?? ''} className="input" /></label>
                <label className="sm:col-span-6"><span className="label">Địa chỉ</span><input name="dia_chi" defaultValue={bn.dia_chi ?? ''} className="input" /></label>
                <label className="sm:col-span-2"><span className="label">Dị ứng thuốc</span><input name="di_ung" defaultValue={bn.di_ung ?? ''} className="input" /></label>
                <label className="sm:col-span-2"><span className="label">Tiền sử bệnh</span><input name="tien_su" defaultValue={bn.tien_su_benh ?? ''} className="input" /></label>
                <label className="sm:col-span-2"><span className="label">Mã hồ sơ giấy</span><input name="ma_giay" defaultValue={bn.ma_ho_so_giay ?? ''} className="input" /></label>
                <div className="sm:col-span-6 flex justify-end"><button className="btn-primary">Lưu thay đổi</button></div>
              </ActionForm>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card title="Liệu trình">
            {lieuTrinh.length === 0 && <p className="text-sm text-gray-500">Không có liệu trình.</p>}
            <div className="space-y-4">
              {lieuTrinh.map((l) => (
                <div key={l.id} className="text-sm">
                  <Link href={`/lieu-trinh/${l.id}`} className="link font-semibold">{l.ten}</Link>
                  <div className="text-xs text-gray-500">{tenNgan(l.bac_si, 'bac_si')} · từ {ngay(l.ngay_bat_dau)} · {l.trang_thai === 'dang_lam' ? 'đang làm' : l.trang_thai === 'hoan_thanh' ? 'hoàn thành' : 'đã dừng'}</div>
                  <div className="mt-2 text-xs">Tiến độ {l.da_lam}/{l.tong_so_buoi} buổi</div>
                  <Bar pct={l.da_lam / l.tong_so_buoi} />
                  <div className="mt-2 text-xs">Đã thu {vnd(l.da_thu)} / {vnd(l.tong_chi_phi)}</div>
                  <Bar pct={l.da_thu / Math.max(1, l.tong_chi_phi)} tone="green" />
                </div>
              ))}
            </div>
          </Card>
          <Card title="Lịch hẹn sắp tới">
            {sapToi.length === 0 ? <p className="text-sm text-gray-500">Không có.</p> : sapToi.map((l) => (
              <div key={l.id} className="mb-2 text-sm">
                <Link href={`/lich-hen/${l.id}`} className="link font-medium">{ngay(l.ngay)} · {gio(l.gio_bat_dau)}</Link>
                <div className="text-xs text-gray-500">{tenNgan(l.bac_si, 'bac_si')} · {l.viec ?? '—'}</div>
              </div>
            ))}
          </Card>
          <Card title="Công nợ">
            <div className={`text-2xl font-semibold ${tongNo ? 'text-red-600' : 'text-emerald-600'}`}>{vnd(tongNo)}</div>
            <div className="text-xs text-gray-500">{hoaDon.filter((h) => h.con_no > 0).length} hóa đơn còn nợ / {hoaDon.length} hóa đơn</div>
          </Card>
        </div>
      </div>
    </>
  )
}

// Suspense nằm trong trang để cả lần tải đầu lẫn khi chuyển trang đều hiện khung chờ ngay (Cache Components).
export default function Page(props: PageProps<'/benh-nhan/[id]'>) {
  return (
    <Suspense fallback={<Skeleton />}>
      <HoSoBenhNhan {...props} />
    </Suspense>
  )
}
