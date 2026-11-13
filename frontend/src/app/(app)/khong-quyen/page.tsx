import { Suspense } from 'react'
import Link from 'next/link'
import { Skeleton } from '@/components/Skeleton'
import { homeOf, requireNhanVien } from '@/lib/session'

export const metadata = { title: 'Không có quyền' }

async function KhongQuyenPage() {
  const nv = await requireNhanVien()
  return (
    <div className="card mx-auto mt-10 max-w-lg p-6 text-center">
      <h2 className="text-lg font-semibold">Bạn không có quyền mở trang này</h2>
      <p className="mt-2 text-sm text-gray-600">Trang hoặc thao tác vừa rồi dành cho vai trò khác. Đổi người đăng nhập nếu cần.</p>
      <Link href={homeOf(nv.vai_tro)} className="btn-primary mt-4">Về trang chính</Link>
    </div>
  )
}

export default function Page() {
  return (
    <Suspense fallback={<Skeleton />}>
      <KhongQuyenPage />
    </Suspense>
  )
}
