import type { Metadata } from 'next'
import { Be_Vietnam_Pro } from 'next/font/google'
import './globals.css'

const font = Be_Vietnam_Pro({
  variable: '--font-be-vietnam',
  subsets: ['latin', 'vietnamese'],
  weight: ['400', '500', '600', '700'],
})

export const metadata: Metadata = {
  title: { default: 'Nụ Cười Việt', template: '%s · Nụ Cười Việt' },
  description: 'Hệ thống quản lý Phòng khám Nha khoa Nụ Cười Việt',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="vi" className={`${font.variable} h-full antialiased`}>
      <body className="min-h-full font-sans">{children}</body>
    </html>
  )
}
