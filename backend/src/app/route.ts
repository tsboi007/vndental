import { NextResponse } from 'next/server'

// Trang gốc của backend: chỉ báo dịch vụ đang chạy (không có giao diện).
export function GET() {
  return NextResponse.json({ service: 'vndental-backend', api: ['/api/dang-nhap', '/api/toi', '/api/trang/<ten>', '/api/lenh/<ten>'] })
}
