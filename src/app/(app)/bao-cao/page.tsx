import { Suspense } from 'react'
import { Skeleton } from '@/components/Skeleton'
import Link from 'next/link'
import { Bar, Card, PageTitle } from '@/components/ui'
import { q } from '@/lib/db'
import { congNgay, homNay, LY_DO_HUY, ngay, so, str, tenNgan, vnd } from '@/lib/format'
import { requireNhanVien } from '@/lib/session'

export const metadata = { title: 'Báo cáo tháng' }

const trieu = (v: number) => `${(v / 1e6).toLocaleString('vi-VN', { maximumFractionDigits: 1 })} tr`

async function BaoCaoPage({ searchParams }: PageProps<'/bao-cao'>) {
  await requireNhanVien('quan_ly')
  // Mặc định: tháng trước (tháng đã khép lại)
  const thang = str((await searchParams).thang) || congNgay(`${homNay().slice(0, 7)}-01`, -1).slice(0, 7)
  const dau = `${thang}-01`

  const [doanhThuBs, gheTrong, quaSauThang, huy, no, lieuTrinh, sapHet, soSanh, theoThang] = await Promise.all([
    // 1. Doanh thu theo bác sĩ
    q<{ ho_ten: string; doanh_thu: number }>(
      `SELECT nv.ho_ten, sum(ct.thanh_tien) AS doanh_thu FROM chi_tiet_hoa_don ct JOIN hoa_don hd ON hd.id = ct.hoa_don_id
       JOIN nhan_vien nv ON nv.id = ct.bac_si_id
       WHERE hd.lap_luc >= $1::date AND hd.lap_luc < $1::date + interval '1 month' GROUP BY nv.id ORDER BY doanh_thu DESC`,
      [dau],
    ),
    // 2. Ghế trống theo khung giờ (chỉ tính các ngày đã qua của tháng)
    q<{ ghe: string; ghe_id: number; gio_bat_dau: number; so_khung: number; so_trong: number }>(
      `WITH khung AS (
         SELECT d::date AS ngay, g.id AS ghe_id, g.ten AS ghe, t::time AS gio
         FROM generate_series($1::date, least($1::date + interval '1 month' - interval '1 day', current_date - 1), interval '1 day') d,
              generate_series(timestamp '2000-01-01 08:00', timestamp '2000-01-01 19:30', interval '30 minutes') t, ghe g
         WHERE g.dang_hoat_dong AND (extract(isodow FROM d) <> 7 OR t::time <= time '16:30'))
       SELECT k.ghe, k.ghe_id, extract(hour FROM k.gio)::int AS gio_bat_dau, count(*) AS so_khung,
              count(*) FILTER (WHERE NOT EXISTS (SELECT 1 FROM lich_hen lh WHERE lh.ghe_id = k.ghe_id AND lh.ngay = k.ngay
                                                AND lh.gio_bat_dau = k.gio AND lh.trang_thai <> 'da_huy')) AS so_trong
       FROM khung k GROUP BY k.ghe, k.ghe_id, extract(hour FROM k.gio) ORDER BY k.ghe_id, 3`,
      [dau],
    ),
    // 3. Quá 6 tháng chưa quay lại
    q<{ id: number; ho_ten: string; sdt: string; lan_cuoi: string }>(
      `SELECT bn.id, bn.ho_ten, bn.sdt, max(p.kham_luc) AS lan_cuoi FROM benh_nhan bn JOIN phieu_dieu_tri p ON p.benh_nhan_id = bn.id
       GROUP BY bn.id HAVING max(p.kham_luc) < now() - interval '6 months'
         AND NOT EXISTS (SELECT 1 FROM lich_hen lh WHERE lh.benh_nhan_id = bn.id AND lh.ngay >= current_date AND lh.trang_thai <> 'da_huy')
       ORDER BY lan_cuoi`,
    ),
    // 4. Hủy lịch: việc gì, lý do gì. "Không đến" tính chung (P6); dời lịch không phải bỏ lịch (P5).
    q<{ viec: string | null; ly_do_huy: string; ben_huy: string | null; n: number }>(
      `SELECT dv.ten AS viec,
              CASE WHEN lh.trang_thai = 'khong_den' THEN 'Không đến (không báo)' ELSE ld.ten END AS ly_do_huy,
              lh.ben_huy, count(*) AS n
       FROM lich_hen lh LEFT JOIN dich_vu dv ON dv.id = lh.dich_vu_id LEFT JOIN ly_do_huy ld ON ld.ma = lh.ly_do_huy_ma
       WHERE lh.trang_thai IN ('da_huy', 'khong_den') AND lh.ly_do_huy_ma IS DISTINCT FROM 'doi_lich'
         AND lh.ngay >= $1::date AND lh.ngay < $1::date + interval '1 month'
       GROUP BY 1, 2, 3`,
      [dau],
    ),
    // 5. Tổng nợ theo người
    q<{ benh_nhan_id: number; ho_ten: string; tong_no: number; so_hd: number }>(
      `SELECT cn.benh_nhan_id, bn.ho_ten, sum(cn.con_no) AS tong_no, count(*) AS so_hd FROM v_cong_no_hoa_don cn
       JOIN benh_nhan bn ON bn.id = cn.benh_nhan_id WHERE cn.con_no > 0 GROUP BY cn.benh_nhan_id, bn.ho_ten ORDER BY tong_no DESC`,
    ),
    // 6. Liệu trình đang dở
    q<{ lieu_trinh_id: number; ho_ten: string; ten: string; so_buoi_da_lam: number; tong_so_buoi: number; so_buoi_con_lai: number }>(
      'SELECT * FROM v_lieu_trinh_dang_do ORDER BY so_buoi_con_lai',
    ),
    // 7. Thuốc / vật tư sắp hết
    q<{ id: number; ten: string; ton_kho: number; nguong_dat_them: number }>('SELECT * FROM v_vat_tu_sap_het ORDER BY ton_kho / nullif(nguong_dat_them, 0)'),
    // 8. So với tháng trước
    q<{ thang_nay: number | null; thang_truoc: number | null }>(
      `SELECT sum(ct.thanh_tien) FILTER (WHERE hd.lap_luc >= $1::date) AS thang_nay,
              sum(ct.thanh_tien) FILTER (WHERE hd.lap_luc < $1::date) AS thang_truoc
       FROM chi_tiet_hoa_don ct JOIN hoa_don hd ON hd.id = ct.hoa_don_id
       WHERE hd.lap_luc >= $1::date - interval '1 month' AND hd.lap_luc < $1::date + interval '1 month'`,
      [dau],
    ),
    q<{ thang: string; doanh_thu: number }>(
      `SELECT to_char(date_trunc('month', hd.lap_luc), 'MM/YYYY') AS thang, sum(ct.thanh_tien) AS doanh_thu
       FROM chi_tiet_hoa_don ct JOIN hoa_don hd ON hd.id = ct.hoa_don_id
       WHERE hd.lap_luc >= $1::date - interval '5 months' AND hd.lap_luc < $1::date + interval '1 month'
       GROUP BY date_trunc('month', hd.lap_luc) ORDER BY date_trunc('month', hd.lap_luc)`,
      [dau],
    ),
  ])

  const maxBs = Math.max(1, ...doanhThuBs.map((d) => d.doanh_thu))
  const gheTong = new Map<string, { khung: number; trong: number }>()
  for (const g of gheTrong) {
    const x = gheTong.get(g.ghe) ?? { khung: 0, trong: 0 }
    gheTong.set(g.ghe, { khung: x.khung + g.so_khung, trong: x.trong + g.so_trong })
  }
  const trongNhat = [...gheTrong].sort((a, b) => b.so_trong / b.so_khung - a.so_trong / a.so_khung)[0]
  const gioCot = [...new Set(gheTrong.map((g) => g.gio_bat_dau))]
  const gom = (key: 'viec' | 'ly_do_huy') => {
    const m = new Map<string, number>()
    huy.forEach((h) => m.set(String(h[key] ?? '(chưa xác định)'), (m.get(String(h[key] ?? '(chưa xác định)')) ?? 0) + h.n))
    return [...m.entries()].sort((a, b) => b[1] - a[1])
  }
  const theoViec = gom('viec')
  const theoLyDo = gom('ly_do_huy')
  const tongHuy = huy.reduce((a, h) => a + h.n, 0)
  const nay = soSanh[0]?.thang_nay ?? 0
  const truoc = soSanh[0]?.thang_truoc ?? 0
  const pct = truoc ? ((nay - truoc) / truoc) * 100 : null
  const maxThang = Math.max(1, ...theoThang.map((t) => t.doanh_thu))
  const tongNo = no.reduce((a, x) => a + x.tong_no, 0)

  return (
    <>
      <PageTitle title="Báo cáo tháng" sub={`Tháng ${thang.slice(5)}/${thang.slice(0, 4)} · 8 câu quản lý hỏi hằng tháng`}>
        <form className="flex gap-2">
          <input type="month" name="thang" defaultValue={thang} className="input w-44" />
          <button className="btn-sec">Xem</button>
        </form>
      </PageTitle>

      <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-4">
        <Card title="1. Doanh thu theo bác sĩ">
          <div className="space-y-3">
            {doanhThuBs.map((d) => (
              <div key={d.ho_ten}>
                <div className="flex justify-between text-sm"><b>{tenNgan(d.ho_ten, 'bac_si')}</b><span className="tabular-nums">{trieu(d.doanh_thu)}</span></div>
                <Bar pct={d.doanh_thu / maxBs} />
              </div>
            ))}
            {doanhThuBs.length === 0 && <p className="text-sm text-gray-500">Chưa có doanh thu.</p>}
          </div>
        </Card>

        <Card title="2. Ghế trống theo khung giờ">
          {trongNhat ? (
            <>
              <p className="mb-2 text-sm">Trống nhiều nhất: <b>{trongNhat.ghe}, {trongNhat.gio_bat_dau}:00–{trongNhat.gio_bat_dau + 1}:00</b> ({Math.round((trongNhat.so_trong / trongNhat.so_khung) * 100)}% khung trống)</p>
              <div className="space-y-1">
                {[...gheTong.keys()].map((ten) => (
                  <div key={ten} className="flex items-center gap-1">
                    <span className="w-12 text-xs">{ten}</span>
                    {gioCot.map((h) => {
                      const o = gheTrong.find((g) => g.ghe === ten && g.gio_bat_dau === h)
                      const r = o ? o.so_trong / o.so_khung : 0
                      return <span key={h} title={`${h}:00 · ${Math.round(r * 100)}% trống`} className="h-5 flex-1 rounded-sm" style={{ background: `rgba(31,111,235,${0.1 + r * 0.9})` }} />
                    })}
                  </div>
                ))}
                <div className="flex gap-1 pl-12 text-[10px] text-gray-400">{gioCot.map((h) => <span key={h} className="flex-1 text-center">{h % 2 === 0 ? `${h}h` : ''}</span>)}</div>
              </div>
              <table className="tbl mt-3">
                <thead><tr><th>Ghế</th><th className="num">Tỷ lệ lấp</th></tr></thead>
                <tbody>{[...gheTong.entries()].map(([ten, v]) => <tr key={ten}><td>{ten}</td><td className="num">{Math.round((1 - v.trong / v.khung) * 100)}%</td></tr>)}</tbody>
              </table>
            </>
          ) : <p className="text-sm text-gray-500">Chưa có ngày nào trong tháng đã qua.</p>}
        </Card>

        <Card title="3. Quá 6 tháng chưa quay lại">
          <div className="text-3xl font-semibold">{quaSauThang.length} <span className="text-sm font-normal text-gray-500">bệnh nhân</span></div>
          <ul className="mt-2 space-y-1 text-sm">
            {quaSauThang.slice(0, 6).map((b) => (
              <li key={b.id} className="flex justify-between"><Link href={`/benh-nhan/${b.id}`} className="link">{b.ho_ten}</Link><span className="text-gray-500">{ngay(b.lan_cuoi).slice(3)}</span></li>
            ))}
          </ul>
          {quaSauThang.length > 6 && (
            <details className="mt-2 text-sm">
              <summary className="cursor-pointer text-brand">Xem cả danh sách kèm SĐT ({quaSauThang.length})</summary>
              <ul className="mt-1 max-h-64 space-y-0.5 overflow-y-auto text-xs">
                {quaSauThang.map((b) => <li key={b.id}>{b.ho_ten} · {b.sdt} · {ngay(b.lan_cuoi)}</li>)}
              </ul>
            </details>
          )}
        </Card>

        <Card title="4. Hủy lịch: việc gì, lý do gì">
          <div className="mb-1 text-xs font-semibold text-gray-500">Theo việc</div>
          {theoViec.slice(0, 4).map(([k, v]) => (
            <div key={k} className="mb-1 grid grid-cols-[1fr_80px_24px] items-center gap-2 text-sm"><span className="truncate">{k}</span><Bar pct={v / (theoViec[0]?.[1] || 1)} tone="amber" /><span className="text-right tabular-nums">{v}</span></div>
          ))}
          <div className="mt-3 mb-1 text-xs font-semibold text-gray-500">Theo lý do</div>
          {theoLyDo.slice(0, 4).map(([k, v]) => (
            <div key={k} className="mb-1 grid grid-cols-[1fr_80px_24px] items-center gap-2 text-sm"><span className="truncate">{LY_DO_HUY[k] ?? k}</span><Bar pct={v / (theoLyDo[0]?.[1] || 1)} tone="red" /><span className="text-right tabular-nums">{v}</span></div>
          ))}
          <p className="mt-2 text-xs text-gray-500">{tongHuy} lịch hủy / không đến (không tính lịch dời) · {huy.filter((h) => h.ben_huy === 'benh_nhan').reduce((a, h) => a + h.n, 0)} do bệnh nhân, {huy.filter((h) => h.ben_huy === 'phong_kham').reduce((a, h) => a + h.n, 0)} do phòng khám</p>
        </Card>

        <Card title="5. Khách còn nợ">
          <div className="text-2xl font-semibold text-red-600">{vnd(tongNo)}</div>
          <div className="text-xs text-gray-500">{no.length} người · {no.reduce((a, x) => a + x.so_hd, 0)} hóa đơn</div>
          <ul className="mt-2 space-y-1 text-sm">
            {no.slice(0, 5).map((x) => <li key={x.benh_nhan_id} className="flex justify-between"><Link href={`/benh-nhan/${x.benh_nhan_id}?tab=hoa-don`} className="link">{x.ho_ten}</Link><span className="tabular-nums">{so(x.tong_no)}</span></li>)}
          </ul>
          <Link href="/cong-no" className="link mt-2 inline-block text-sm">Mở màn Công nợ</Link>
        </Card>

        <Card title="6. Liệu trình đang dở">
          <div className="space-y-3">
            {lieuTrinh.map((l) => (
              <div key={l.lieu_trinh_id}>
                <div className="flex justify-between text-sm"><Link href={`/lieu-trinh/${l.lieu_trinh_id}`} className="link truncate">{l.ho_ten} · {l.ten}</Link><b className="whitespace-nowrap">còn {l.so_buoi_con_lai}</b></div>
                <Bar pct={l.so_buoi_da_lam / l.tong_so_buoi} tone="green" />
              </div>
            ))}
            {lieuTrinh.length === 0 && <p className="text-sm text-gray-500">Không có liệu trình đang dở.</p>}
          </div>
        </Card>

        <Card title="7. Thuốc / vật tư sắp hết">
          <ul className="space-y-1.5 text-sm">
            {sapHet.map((v) => <li key={v.id} className="flex justify-between"><span>{v.ten}</span><b className={v.ton_kho === 0 ? 'text-red-600' : 'text-amber-600'}>{so(v.ton_kho)} / {so(v.nguong_dat_them)}</b></li>)}
          </ul>
          {sapHet.length === 0 && <p className="text-sm text-gray-500">Không có món nào dưới ngưỡng.</p>}
          <Link href="/kho?loc=sap_het" className="link mt-2 inline-block text-sm">Mở màn Kho</Link>
        </Card>

        <Card title="8. Doanh thu so tháng trước">
          <div className={`text-3xl font-semibold ${pct == null ? '' : pct >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
            {pct == null ? '—' : `${pct >= 0 ? '+' : ''}${pct.toLocaleString('vi-VN', { maximumFractionDigits: 1 })} %`}
          </div>
          <div className="text-sm">{trieu(nay)} đ (tháng này)</div>
          <div className="text-sm text-gray-500">{trieu(truoc)} đ (tháng trước)</div>
          <div className="mt-3 flex h-28 items-end gap-2">
            {theoThang.map((t, i) => (
              <div key={t.thang} className="flex flex-1 flex-col items-center gap-1">
                <div className={`w-full rounded-t ${i === theoThang.length - 1 ? 'bg-brand' : 'bg-blue-200'}`} style={{ height: `${(t.doanh_thu / maxThang) * 90}px` }} title={vnd(t.doanh_thu)} />
                <span className="text-[10px] text-gray-500">{t.thang.slice(0, 2)}</span>
              </div>
            ))}
          </div>
          {thang === homNay().slice(0, 7) && <p className="mt-1 text-xs text-gray-400">Tháng này chưa hết nên % sẽ còn thay đổi.</p>}
        </Card>
      </div>
    </>
  )
}

// Suspense nằm trong trang để cả lần tải đầu lẫn khi chuyển trang đều hiện khung chờ ngay (Cache Components).
export default function Page(props: PageProps<'/bao-cao'>) {
  return (
    <Suspense fallback={<Skeleton />}>
      <BaoCaoPage {...props} />
    </Suspense>
  )
}
