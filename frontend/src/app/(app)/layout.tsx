import { Suspense } from 'react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { NavLink } from '@/components/NavLink'
import { ngayDayDu, homNay, tenNgan, VAI_TRO } from '@/lib/format'
import { getNhanVien, type VaiTro } from '@/lib/session'
import { dangXuat } from '../dang-nhap/actions'

// Quản lý thấy mọi mục; các vai trò khác chỉ thấy mục có tên vai trò của mình.
const MENU: { nhom: string; items: { href: string; ten: string; roles: VaiTro[] }[] }[] = [
  {
    nhom: 'Lễ tân',
    items: [
      { href: '/lich-hen', ten: 'Lịch hẹn', roles: ['le_tan', 'bac_si'] },
      { href: '/nhac-lich', ten: 'Nhắc lịch', roles: ['le_tan'] },
      { href: '/tiep-nhan', ten: 'Tiếp nhận', roles: ['le_tan'] },
      { href: '/benh-nhan', ten: 'Bệnh nhân', roles: ['le_tan', 'bac_si'] },
      { href: '/hoa-don', ten: 'Hóa đơn & thu tiền', roles: ['le_tan'] },
      { href: '/doi-soat', ten: 'Đối soát cuối ngày', roles: ['le_tan'] },
    ],
  },
  {
    nhom: 'Bác sĩ',
    items: [
      { href: '/phieu-dieu-tri', ten: 'Phiếu điều trị', roles: ['bac_si'] },
      { href: '/lieu-trinh', ten: 'Liệu trình', roles: ['bac_si', 'le_tan'] },
    ],
  },
  {
    nhom: 'Quản lý',
    items: [
      { href: '/ca-truc', ten: 'Ca trực', roles: [] },
      { href: '/bang-gia', ten: 'Bảng giá', roles: [] },
      { href: '/cong-no', ten: 'Công nợ', roles: [] },
      { href: '/kho', ten: 'Kho thuốc & vật tư', roles: [] },
      { href: '/bao-cao', ten: 'Báo cáo tháng', roles: [] },
      { href: '/danh-muc', ten: 'Nhân viên & danh mục', roles: [] },
    ],
  },
]

async function SideNav() {
  const nv = await getNhanVien()
  if (!nv) redirect('/dang-nhap')
  const sapHet = { n: nv.vat_tu_sap_het }
  return (
    <nav className="space-y-4">
      {MENU.map((g) => {
        const items = g.items.filter((i) => nv.vai_tro === 'quan_ly' || i.roles.includes(nv.vai_tro))
        if (!items.length) return null
        return (
          <div key={g.nhom}>
            <div className="mb-1 px-3 text-[11px] font-semibold tracking-wide text-gray-400 uppercase">{g.nhom}</div>
            {items.map((i) => (
              <NavLink key={i.href} href={i.href}>
                {i.ten}
                {i.href === '/kho' && sapHet?.n ? (
                  <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 text-[11px] font-semibold text-amber-700">{sapHet.n}</span>
                ) : null}
              </NavLink>
            ))}
          </div>
        )
      })}
    </nav>
  )
}

async function TopUser() {
  const nv = await getNhanVien()
  if (!nv) return null
  return (
    <div className="flex items-center gap-3">
      <span className="hidden text-xs text-gray-500 sm:inline">{ngayDayDu(homNay())}</span>
      <span className="flex size-8 items-center justify-center rounded-full bg-gray-100 text-xs font-semibold text-gray-700">
        {tenNgan(nv.ho_ten).slice(0, 2)}
      </span>
      <div className="leading-tight">
        <div className="text-sm font-semibold">{tenNgan(nv.ho_ten, nv.vai_tro)}</div>
        <div className="text-xs text-gray-500">{VAI_TRO[nv.vai_tro]}</div>
      </div>
      <Link href="/doi-mat-khau" className="btn-sec btn-sm">Mật khẩu</Link>
      <form action={dangXuat}>
        <button className="btn-sec btn-sm">Đăng xuất</button>
      </form>
    </div>
  )
}

export default function AppLayout({ children }: LayoutProps<'/'>) {
  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-56 shrink-0 overflow-y-auto border-r border-gray-200 bg-white px-2 py-3 md:block print:hidden">
        <div className="mb-5 flex items-center gap-2 px-2">
          <span className="flex size-8 items-center justify-center rounded-md bg-brand text-sm font-bold text-white">NC</span>
          <span className="font-semibold">Nụ Cười Việt</span>
        </div>
        <Suspense fallback={null}>
          <SideNav />
        </Suspense>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-10 flex h-14 items-center justify-end border-b border-gray-200 bg-white/95 px-6 backdrop-blur print:hidden">
          <Suspense fallback={null}>
            <TopUser />
          </Suspense>
        </header>
        <main className="p-6">{children}</main>
      </div>
    </div>
  )
}
