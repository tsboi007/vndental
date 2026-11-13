import { Suspense } from 'react'
import { Skeleton } from '@/components/Skeleton'
import { ActionForm } from '@/components/ActionForm'
import { Card, PageTitle } from '@/components/ui'
const MAT_KHAU_TOI_THIEU = 8 // giống backend/src/lib/mat-khau.ts
import { requireNhanVien } from '@/lib/session'
import { doiMatKhau } from './actions'

export const metadata = { title: 'Đổi mật khẩu' }

async function DoiMatKhauPage() {
  const nv = await requireNhanVien()
  return (
    <>
      <PageTitle title="Đổi mật khẩu" sub={nv.ho_ten} />
      <Card className="max-w-md">
        <ActionForm action={doiMatKhau} className="grid gap-3" resetOnOk>
          <label><span className="label">Mật khẩu hiện tại</span>
            <input name="mat_khau_cu" type="password" required autoComplete="current-password" className="input" />
          </label>
          <label><span className="label">Mật khẩu mới (ít nhất {MAT_KHAU_TOI_THIEU} ký tự)</span>
            <input name="mat_khau_moi" type="password" required minLength={MAT_KHAU_TOI_THIEU} autoComplete="new-password" className="input" />
          </label>
          <label><span className="label">Nhập lại mật khẩu mới</span>
            <input name="nhap_lai" type="password" required minLength={MAT_KHAU_TOI_THIEU} autoComplete="new-password" className="input" />
          </label>
          <button className="btn-primary">Đổi mật khẩu</button>
        </ActionForm>
      </Card>
    </>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <DoiMatKhauPage />
    </Suspense>
  )
}
