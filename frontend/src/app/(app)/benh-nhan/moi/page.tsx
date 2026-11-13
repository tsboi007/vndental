import { Suspense } from 'react'
import { Skeleton } from '@/components/Skeleton'
import Link from 'next/link'
import { ActionForm } from '@/components/ActionForm'
import { Card, PageTitle } from '@/components/ui'
import { trang } from '@/lib/api'

import { requireNhanVien } from '@/lib/session'
import { taoBenhNhan } from '../../lich-hen/actions'

export const metadata = { title: 'Tạo hồ sơ bệnh nhân' }

async function TaoBenhNhanPage({ searchParams }: PageProps<'/benh-nhan/moi'>) {
  await requireNhanVien('le_tan', 'bac_si')
  const sp = await searchParams
  const { sdt, daCo } = await trang('benh-nhan-moi', sp)

  return (
    <>
      <PageTitle title="Tạo hồ sơ bệnh nhân" sub="Mã hồ sơ tự sinh. Không xóa hồ sơ (giữ tối thiểu 5 năm).">
        <Link href="/benh-nhan" className="btn-sec">← Danh sách bệnh nhân</Link>
      </PageTitle>
      <Card className="max-w-3xl">
        {daCo.length > 0 && (
          <div className="mb-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm">
            ⚠ Số {sdt} đã có {daCo.length} hồ sơ:{' '}
            {daCo.map((b, i) => (
              <span key={b.id}>
                {i > 0 && ', '}
                <Link href={`/benh-nhan/${b.id}`} className="link">{b.ho_ten} ({b.ma_ho_so})</Link>
              </span>
            ))}
            . Kiểm tra lại để tránh tạo trùng người.
          </div>
        )}
        <ActionForm action={taoBenhNhan} className="grid gap-4 sm:grid-cols-6">
          <label className="sm:col-span-3">
            <span className="label">Họ và tên *</span>
            <input name="ho_ten" required className="input" />
          </label>
          <label className="sm:col-span-2">
            <span className="label">Ngày sinh</span>
            <input name="ngay_sinh" type="date" className="input" />
          </label>
          <div>
            <span className="label">Giới tính</span>
            <select name="gioi_tinh" className="input">
              <option value="">—</option>
              <option value="M">Nam</option>
              <option value="F">Nữ</option>
            </select>
          </div>
          <label className="sm:col-span-2">
            <span className="label">Số điện thoại liên lạc *</span>
            <input name="sdt" required defaultValue={sdt} inputMode="tel" className="input" />
          </label>
          <div className="sm:col-span-4">
            <span className="label">Số này là của</span>
            <div className="flex h-9 items-center gap-4 text-sm">
              <label className="flex items-center gap-1.5"><input type="radio" name="sdt_la" value="chinh_chu" defaultChecked /> Chính bệnh nhân</label>
              <label className="flex items-center gap-1.5"><input type="radio" name="sdt_la" value="giam_ho" /> Người giám hộ (bệnh nhân &lt; 15 tuổi)</label>
            </div>
          </div>
          <label className="sm:col-span-4">
            <span className="label">Tên người giám hộ (nếu là số của người giám hộ)</span>
            <input name="ten_giam_ho" className="input" />
          </label>
          <label className="sm:col-span-2">
            <span className="label">Quan hệ</span>
            <select name="quan_he" className="input" defaultValue="">
              <option value="">—</option>
              <option>Mẹ</option>
              <option>Bố</option>
              <option>Ông/Bà</option>
              <option>Khác</option>
            </select>
          </label>
          <label className="sm:col-span-6">
            <span className="label">Địa chỉ</span>
            <input name="dia_chi" className="input" />
          </label>
          <label className="sm:col-span-2">
            <span className="label">Dị ứng thuốc</span>
            <input name="di_ung" className="input" placeholder="VD: Penicillin" />
          </label>
          <label className="sm:col-span-4">
            <span className="label">Tiền sử bệnh</span>
            <input name="tien_su" className="input" placeholder="Bệnh nền: tim mạch, tiểu đường, đang mang thai…" />
          </label>
          <label className="sm:col-span-3">
            <span className="label">Mã hồ sơ giấy cũ (nếu có)</span>
            <input name="ma_giay" className="input" placeholder="VD: HS-2019-0387" />
          </label>
          <div className="flex items-end justify-end gap-2 sm:col-span-3">
            <button name="tiep" value="ho_so" className="btn-sec">Lưu</button>
            <button name="tiep" value="dat_lich" className="btn-primary">Lưu &amp; đặt lịch</button>
          </div>
        </ActionForm>
      </Card>
    </>
  )
}

// Suspense nằm trong trang để cả lần tải đầu lẫn khi chuyển trang đều hiện khung chờ ngay (Cache Components).
export default function Page(props: PageProps<'/benh-nhan/moi'>) {
  return (
    <Suspense fallback={<Skeleton />}>
      <TaoBenhNhanPage {...props} />
    </Suspense>
  )
}
