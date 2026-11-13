import { NextResponse, type NextRequest } from 'next/server'

// Kiểm tra nhanh: chưa có cookie đăng nhập thì về /dang-nhap.
// Quyền thật sự được kiểm tra lại trong từng trang và Server Action (requireNhanVien).
const HOME: Record<string, string> = { bac_si: '/phieu-dieu-tri', quan_ly: '/bao-cao', le_tan: '/lich-hen' }

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl
  if (pathname === '/dang-nhap') return NextResponse.next()
  if (!req.cookies.get('nv')?.value) return NextResponse.redirect(new URL('/dang-nhap', req.url))
  if (pathname === '/') {
    const home = HOME[req.cookies.get('vt')?.value ?? ''] ?? '/lich-hen'
    return NextResponse.redirect(new URL(home, req.url))
  }
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/|favicon.ico|.*\\..*).*)'],
}
