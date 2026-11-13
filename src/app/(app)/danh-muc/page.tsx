import { Suspense } from 'react'
import { Skeleton } from '@/components/Skeleton'
import { ActionForm } from '@/components/ActionForm'
import { Card, PageTitle, Tabs } from '@/components/ui'
import { q } from '@/lib/db'
import { sdtDep } from '@/lib/data'
import { str, vnd, VAI_TRO } from '@/lib/format'
import { requireNhanVien } from '@/lib/session'
import { batTatDichVu, batTatGhe, batTatLyDo, datLaiMatKhau, doiTrangThaiNhanVien, themDichVu, themGhe, themLyDo, themNhanVien } from './actions'

export const metadata = { title: 'Nhân viên & danh mục' }

function BatTat({ action, name, value, on, onText, offText }: {
  action: Parameters<typeof ActionForm>[0]['action']; name: string; value: string | number; on: boolean; onText: string; offText: string
}) {
  return (
    <ActionForm action={action}>
      <input type="hidden" name={name} value={value} />
      <button className={`chip ${on ? 'border-emerald-300 bg-emerald-50 text-emerald-700' : 'border-gray-300 bg-gray-100 text-gray-500'}`} title="Bấm để đổi">
        {on ? onText : offText}
      </button>
    </ActionForm>
  )
}

async function DanhMucPage({ searchParams }: PageProps<'/danh-muc'>) {
  const nv = await requireNhanVien('quan_ly')
  const tab = str((await searchParams).tab) || 'nhan_vien'
  const t = (k: string, label: string) => ({ href: `/danh-muc?tab=${k}`, label, active: tab === k })

  const [nhanVien, dichVu, ghe, lyDo] = await Promise.all([
    q<{ id: number; ho_ten: string; sdt: string | null; vai_tro: string; ten_dang_nhap: string; ban_thoi_gian: boolean; dang_lam_viec: boolean; so_ca_tuan: number; co_mat_khau: boolean }>(
      `SELECT nv.id, nv.ho_ten, nv.sdt, nv.vai_tro, nv.ten_dang_nhap, nv.ban_thoi_gian, nv.dang_lam_viec, nv.mat_khau_hash IS NOT NULL AS co_mat_khau, (SELECT count(*) FROM ca_truc ct WHERE ct.nhan_vien_id = nv.id AND ct.ngay BETWEEN current_date AND current_date + 6) AS so_ca_tuan
       FROM nhan_vien nv ORDER BY nv.dang_lam_viec DESC, array_position(ARRAY['bac_si','le_tan','quan_ly'], nv.vai_tro::text), nv.id`,
    ),
    q<{ id: number; ma: string; ten: string; nhom: string | null; don_vi: string; theo_rang: boolean; dang_ap_dung: boolean; gia: number | null; so_lan: number }>(
      `SELECT dv.*, gia_tai_ngay(dv.id, current_date) AS gia,
              (SELECT count(*) FROM chi_tiet_dieu_tri ct WHERE ct.dich_vu_id = dv.id) AS so_lan
       FROM dich_vu dv ORDER BY dv.dang_ap_dung DESC, dv.id`,
    ),
    q<{ id: number; ten: string; dang_hoat_dong: boolean; lich_sap_toi: number }>(
      `SELECT g.*, (SELECT count(*) FROM lich_hen lh WHERE lh.ghe_id = g.id AND lh.ngay >= current_date AND lh.trang_thai IN ('da_dat','da_nhac')) AS lich_sap_toi
       FROM ghe g ORDER BY g.id`,
    ),
    q<{ ma: string; ten: string; dang_dung: boolean; so_lan: number }>(
      `SELECT ld.*, (SELECT count(*) FROM lich_hen lh WHERE lh.ly_do_huy_ma = ld.ma) AS so_lan
       FROM ly_do_huy ld ORDER BY ld.dang_dung DESC, so_lan DESC`,
    ),
  ])

  return (
    <>
      <PageTitle title="Nhân viên & danh mục" sub="UC23 · không xóa dữ liệu đã dùng — chỉ tạm ngừng để giữ lịch sử (G10)" />
      <Tabs
        items={[
          t('nhan_vien', `Nhân viên (${nhanVien.filter((x) => x.dang_lam_viec).length})`),
          t('dich_vu', `Dịch vụ (${dichVu.length})`),
          t('ghe', `Ghế (${ghe.length})`),
          t('ly_do', `Lý do hủy (${lyDo.length})`),
        ]}
      />

      {tab === 'nhan_vien' && (
        <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
          <div className="card overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Họ tên</th><th>Vai trò</th><th>Tên đăng nhập</th><th>Điện thoại</th><th className="num">Ca 7 ngày tới</th><th>Trạng thái</th><th>Mật khẩu</th></tr></thead>
              <tbody>
                {nhanVien.map((x) => (
                  <tr key={x.id} className={x.dang_lam_viec ? '' : 'text-gray-400'}>
                    <td className="font-medium">{x.ho_ten}{x.id === nv.id ? <span className="ml-1 text-xs text-gray-400">(bạn)</span> : null}</td>
                    <td>{VAI_TRO[x.vai_tro]}{x.ban_thoi_gian ? ' · bán thời gian' : ''}</td>
                    <td className="text-gray-600">{x.ten_dang_nhap}</td>
                    <td className="tabular-nums">{sdtDep(x.sdt)}</td>
                    <td className="num">{x.so_ca_tuan}</td>
                    <td><BatTat action={doiTrangThaiNhanVien} name="id" value={x.id} on={x.dang_lam_viec} onText="Đang làm việc" offText="Đã nghỉ" /></td>
                    <td>
                      <ActionForm action={datLaiMatKhau} confirm={`Đặt lại mật khẩu cho ${x.ten_dang_nhap}? Mật khẩu cũ sẽ không dùng được nữa.`}>
                        <input type="hidden" name="id" value={x.id} />
                        {!x.co_mat_khau && <span className="mr-1 text-xs text-amber-600">Chưa đặt ·</span>}
                        <button className="btn-sec btn-sm">Đặt lại</button>
                      </ActionForm>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Card title="Thêm nhân viên">
            <ActionForm action={themNhanVien} className="grid gap-3" resetOnOk>
              <label><span className="label">Họ tên *</span><input name="ho_ten" required className="input" /></label>
              <label><span className="label">Vai trò *</span>
                <select name="vai_tro" required className="input" defaultValue="le_tan">
                  {Object.entries(VAI_TRO).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
              </label>
              <label><span className="label">Tên đăng nhập *</span><input name="ten_dang_nhap" required className="input" placeholder="VD: lt.thao" /></label>
              <label><span className="label">Điện thoại</span><input name="sdt" className="input" /></label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="ban_thoi_gian" value="1" /> Bán thời gian</label>
              <button className="btn-primary">Thêm</button>
            </ActionForm>
            <p className="mt-2 text-xs text-gray-500">Thêm xong, màn hình hiện <b>mật khẩu tạm</b> một lần — đưa cho nhân viên và nhắc đổi ở mục Mật khẩu. Người đã nghỉ không đăng nhập được, không xếp ca và không nhận lịch hẹn mới. Lịch sử khám, hủy, sửa phiếu vẫn giữ tên người đó.</p>
          </Card>
        </div>
      )}

      {tab === 'dich_vu' && (
        <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
          <div className="card overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Mã</th><th>Tên dịch vụ</th><th>Nhóm</th><th>Đơn vị</th><th>Theo răng</th><th className="num">Giá hôm nay</th><th className="num">Đã làm</th><th>Trạng thái</th></tr></thead>
              <tbody>
                {dichVu.map((d) => (
                  <tr key={d.id} className={d.dang_ap_dung ? '' : 'text-gray-400'}>
                    <td className="text-gray-500">{d.ma}</td>
                    <td className="font-medium">{d.ten}</td>
                    <td className="text-gray-600">{d.nhom ?? '—'}</td>
                    <td>{d.don_vi}</td>
                    <td>{d.theo_rang ? 'Bắt buộc ghi răng' : '—'}</td>
                    <td className="num">{d.gia == null ? <span className="text-amber-700">chưa có giá</span> : vnd(d.gia)}</td>
                    <td className="num">{d.so_lan}</td>
                    <td><BatTat action={batTatDichVu} name="id" value={d.id} on={d.dang_ap_dung} onText="Đang áp dụng" offText="Ngừng" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Card title="Thêm dịch vụ">
            <ActionForm action={themDichVu} className="grid grid-cols-2 gap-3" resetOnOk>
              <label><span className="label">Mã *</span><input name="ma" required className="input" placeholder="VD: VENEER" /></label>
              <label><span className="label">Đơn vị *</span><input name="don_vi" required defaultValue="lần" className="input" /></label>
              <label className="col-span-2"><span className="label">Tên dịch vụ *</span><input name="ten" required className="input" /></label>
              <label><span className="label">Nhóm</span><input name="nhom" className="input" placeholder="VD: tham_my" /></label>
              <label><span className="label">Giá từ hôm nay (đ)</span><input name="gia" type="number" min={0} step={1000} className="input" /></label>
              <label className="col-span-2 flex items-center gap-2 text-sm"><input type="checkbox" name="theo_rang" value="1" defaultChecked /> Phải ghi số răng khi làm (L4)</label>
              <button className="btn-primary col-span-2">Thêm</button>
            </ActionForm>
            <p className="mt-2 text-xs text-gray-500">Đổi giá về sau làm ở màn Bảng giá (theo ngày hiệu lực, không ghi đè giá cũ — L5).</p>
          </Card>
        </div>
      )}

      {tab === 'ghe' && (
        <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
          <div className="card overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Ghế</th><th className="num">Lịch sắp tới</th><th>Trạng thái</th></tr></thead>
              <tbody>
                {ghe.map((g) => (
                  <tr key={g.id} className={g.dang_hoat_dong ? '' : 'text-gray-400'}>
                    <td className="font-medium">{g.ten}</td>
                    <td className="num">{g.lich_sap_toi}</td>
                    <td><BatTat action={batTatGhe} name="id" value={g.id} on={g.dang_hoat_dong} onText="Đang hoạt động" offText="Ngừng (bảo trì)" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Card title="Thêm ghế">
            <ActionForm action={themGhe} className="flex gap-2" resetOnOk>
              <input name="ten" required className="input" placeholder="VD: Ghế 4" />
              <button className="btn-primary">Thêm</button>
            </ActionForm>
            <p className="mt-2 text-xs text-gray-500">Ghế ngừng hoạt động biến khỏi lưới lịch hẹn; lịch đã đặt trên ghế đó cần dời sang ghế khác.</p>
          </Card>
        </div>
      )}

      {tab === 'ly_do' && (
        <div className="grid gap-4 xl:grid-cols-[1fr_340px]">
          <div className="card overflow-x-auto">
            <table className="tbl">
              <thead><tr><th>Mã</th><th>Lý do</th><th className="num">Đã dùng</th><th>Trạng thái</th></tr></thead>
              <tbody>
                {lyDo.map((l) => (
                  <tr key={l.ma} className={l.dang_dung ? '' : 'text-gray-400'}>
                    <td className="text-gray-500">{l.ma}</td>
                    <td className="font-medium">{l.ten}</td>
                    <td className="num">{l.so_lan}</td>
                    <td><BatTat action={batTatLyDo} name="ma" value={l.ma} on={l.dang_dung} onText="Đang dùng" offText="Ẩn" /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Card title="Thêm lý do hủy">
            <ActionForm action={themLyDo} className="grid gap-3" resetOnOk>
              <label><span className="label">Mã *</span><input name="ma" required className="input" placeholder="VD: thoi_tiet" /></label>
              <label><span className="label">Tên hiển thị *</span><input name="ten" required className="input" placeholder="VD: Mưa bão, không đi được" /></label>
              <button className="btn-primary">Thêm</button>
            </ActionForm>
            <p className="mt-2 text-xs text-gray-500">Lý do là danh mục (P4) để báo cáo đếm được &quot;hủy vì lý do gì&quot;. Lý do ẩn không hiện khi hủy lịch mới nhưng vẫn giữ trên lịch cũ.</p>
          </Card>
        </div>
      )}
    </>
  )
}

export default function Page(props: PageProps<'/danh-muc'>) {
  return (
    <Suspense fallback={<Skeleton />}>
      <DanhMucPage {...props} />
    </Suspense>
  )
}
