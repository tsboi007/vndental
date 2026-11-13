import { Suspense } from 'react'
import { Skeleton } from '@/components/Skeleton'
import Link from 'next/link'

import { ActionForm } from '@/components/ActionForm'
import { Card, DiUng, PageTitle, TrangThai } from '@/components/ui'
import { gio, homNay, LY_DO_HUY, ngayDayDu, ngayGio, tenNgan, tuoi } from '@/lib/format'
import { requireNhanVien } from '@/lib/session'
import { doiTrangThai, huyLich } from '../actions'
import { trang } from '@/lib/api'

async function LichHenChiTiet({ params }: PageProps<'/lich-hen/[id]'>) {
  const nv = await requireNhanVien('le_tan', 'bac_si')
  const { l, nhac, choXuLy, lyDo } = await trang('lich-hen-chi-tiet', await params)

  return (
    <>
      <PageTitle title={`${gio(l.gio_bat_dau)} – ${ngayDayDu(l.ngay)}`} sub={`${l.ghe} · ${tenNgan(l.bac_si, 'bac_si')}`}>
        <Link href={`/lich-hen?ngay=${l.ngay}`} className="btn-sec">← Về lịch ngày này</Link>
      </PageTitle>

      <div className="grid gap-4 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">
          <Card title="Lịch hẹn" right={<TrangThai tt={l.trang_thai} />}>
            <dl className="grid grid-cols-[140px_1fr] gap-y-2 text-sm">
              <dt className="text-gray-500">Bệnh nhân</dt>
              <dd>
                <Link href={`/benh-nhan/${l.benh_nhan_id}`} className="link font-medium">{l.ho_ten}</Link> · {l.ma_ho_so}
                {l.ngay_sinh ? ` · ${tuoi(l.ngay_sinh)}` : ''} <DiUng text={l.di_ung && `Dị ứng: ${l.di_ung}`} /> <DiUng text={l.tien_su_benh} />
              </dd>
              <dt className="text-gray-500">Điện thoại</dt>
              <dd>{l.sdt}{l.sdt_la_cua ? ` (số của ${l.sdt_la_cua.toLowerCase()})` : ''}</dd>
              <dt className="text-gray-500">Việc cần làm</dt>
              <dd>{l.viec ?? '—'}{l.noi_dung ? ` · ${l.noi_dung}` : ''}</dd>
              {l.lieu_trinh && (
                <>
                  <dt className="text-gray-500">Liệu trình</dt>
                  <dd>{l.lieu_trinh} · buổi {l.buoi_thu}</dd>
                </>
              )}
              <dt className="text-gray-500">Người đặt</dt>
              <dd>{tenNgan(l.nguoi_dat)} · {ngayGio(l.dat_luc)}</dd>
              {l.trang_thai === 'da_huy' && (
                <>
                  <dt className="text-gray-500">Đã hủy</dt>
                  <dd className="text-red-700">
                    {l.ly_do_ten ?? LY_DO_HUY[l.ly_do_huy_ma ?? '']} · bên hủy: {l.ben_huy === 'benh_nhan' ? 'bệnh nhân' : 'phòng khám'}
                    {l.ghi_chu_huy ? ` · “${l.ghi_chu_huy}”` : ''} · ghi bởi {tenNgan(l.nguoi_huy ?? '')} lúc {ngayGio(l.huy_luc)}
                  </dd>
                </>
              )}
              {l.doi_sang_id && (
                <>
                  <dt className="text-gray-500">Đã dời sang</dt>
                  <dd><Link href={`/lich-hen/${l.doi_sang_id}`} className="link">Lịch hẹn mới →</Link></dd>
                </>
              )}
              {l.doi_tu_lich_hen_id && (
                <>
                  <dt className="text-gray-500">Dời từ</dt>
                  <dd><Link href={`/lich-hen/${l.doi_tu_lich_hen_id}`} className="link">Lịch hẹn cũ (đã hủy) →</Link></dd>
                </>
              )}
            </dl>
            <div className="mt-4 flex flex-wrap gap-2">
              {choXuLy && l.ngay === homNay() && (
                <ActionForm action={doiTrangThai}>
                  <input type="hidden" name="id" value={l.id} />
                  <input type="hidden" name="tt" value="da_den" />
                  <button className="btn-primary">Bệnh nhân đã đến</button>
                </ActionForm>
              )}
              {choXuLy && l.ngay <= homNay() && (
                <ActionForm action={doiTrangThai} confirm="Ghi nhận bệnh nhân không đến?">
                  <input type="hidden" name="id" value={l.id} />
                  <input type="hidden" name="tt" value="khong_den" />
                  <button className="btn-sec">Không đến</button>
                </ActionForm>
              )}
              {l.phieu_id ? (
                <Link href={`/phieu-dieu-tri/${l.phieu_id}`} className="btn-sec">Mở phiếu điều trị</Link>
              ) : (
                l.trang_thai === 'da_den' && (nv.vai_tro !== 'le_tan') && (
                  <Link href={`/phieu-dieu-tri?lich=${l.id}`} className="btn-primary">Bắt đầu khám</Link>
                )
              )}
            </div>
          </Card>

          <Card title="Nhắc lịch">
            {nhac.length === 0 ? (
              <p className="text-sm text-gray-500">Chưa nhắc lần nào.</p>
            ) : (
              <ul className="space-y-1 text-sm">
                {nhac.map((x, i) => (
                  <li key={i}>
                    <span className="text-gray-500">{ngayGio(x.thoi_diem)}</span> · {x.kenh === 'goi_dien' ? 'Gọi điện' : 'Tin nhắn'} —{' '}
                    {{ nghe_may: 'nghe máy', khong_nghe: 'không nghe', da_gui: 'đã gửi', gui_loi: 'gửi lỗi' }[x.ket_qua]} · {x.ai ? tenNgan(x.ai) : 'tự động'}
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>

        {choXuLy && (
          <Card title="Hủy / dời lịch hẹn">
            <ActionForm action={huyLich} className="space-y-3">
              <input type="hidden" name="id" value={l.id} />
              <div>
                <span className="label">Bên hủy *</span>
                <div className="flex gap-4 text-sm">
                  <label className="flex items-center gap-1.5"><input type="radio" name="ben_huy" value="benh_nhan" defaultChecked /> Bệnh nhân</label>
                  <label className="flex items-center gap-1.5"><input type="radio" name="ben_huy" value="phong_kham" /> Phòng khám</label>
                </div>
              </div>
              <label className="block">
                <span className="label">Lý do *</span>
                <select name="ly_do" required className="input" defaultValue="">
                  <option value="" disabled>— Chọn lý do —</option>
                  {lyDo.filter((x) => x.ma !== 'doi_lich').map((x) => <option key={x.ma} value={x.ma}>{x.ten}</option>)}
                </select>
              </label>
              <label className="block">
                <span className="label">Ghi chú</span>
                <textarea name="ghi_chu" rows={2} className="input" />
              </label>
              <p className="text-xs text-gray-500">Người ghi nhận ({tenNgan(nv.ho_ten, nv.vai_tro)}) và thời điểm được lưu tự động. Lịch hủy không bị xóa (L10).</p>
              <div className="flex flex-wrap gap-2">
                <button name="sau" value="dat_lai" className="btn-sec">Hủy &amp; đặt khung khác</button>
                <button className="btn-danger">Xác nhận hủy</button>
              </div>
            </ActionForm>
            <div className="my-4 border-t border-gray-100" />
            <ActionForm action={huyLich} className="space-y-2">
              <input type="hidden" name="id" value={l.id} />
              <input type="hidden" name="ly_do" value="doi_lich" />
              <input type="hidden" name="sau" value="dat_lai" />
              <div className="text-sm font-semibold">Dời lịch</div>
              <div className="flex gap-4 text-sm">
                <label className="flex items-center gap-1.5"><input type="radio" name="ben_huy" value="benh_nhan" defaultChecked /> Bệnh nhân xin dời</label>
                <label className="flex items-center gap-1.5"><input type="radio" name="ben_huy" value="phong_kham" /> Phòng khám dời</label>
              </div>
              <input name="ghi_chu" className="input" placeholder="Ghi chú (không bắt buộc)" />
              <p className="text-xs text-gray-500">Lịch này được hủy với lý do &quot;Dời sang lịch khác&quot; rồi mở màn đặt lịch; lịch mới liên kết với lịch cũ (P5).</p>
              <button className="btn-sec">Dời sang khung khác →</button>
            </ActionForm>
          </Card>
        )}
      </div>
    </>
  )
}

// Suspense nằm trong trang để cả lần tải đầu lẫn khi chuyển trang đều hiện khung chờ ngay (Cache Components).
export default function Page(props: PageProps<'/lich-hen/[id]'>) {
  return (
    <Suspense fallback={<Skeleton />}>
      <LichHenChiTiet {...props} />
    </Suspense>
  )
}
