import Link from 'next/link'
import { TRANG_THAI } from '@/lib/format'

export function PageTitle({ title, sub, children }: { title: string; sub?: React.ReactNode; children?: React.ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        {sub && <p className="mt-0.5 text-sm text-gray-500">{sub}</p>}
      </div>
      {children && <div className="flex flex-wrap items-center gap-2">{children}</div>}
    </div>
  )
}

export function Card({
  title,
  right,
  children,
  className = '',
  pad = true,
}: {
  title?: React.ReactNode
  right?: React.ReactNode
  children: React.ReactNode
  className?: string
  pad?: boolean
}) {
  return (
    <section className={`card ${className}`}>
      {title && (
        <div className="card-title">
          <span>{title}</span>
          {right && <span className="text-xs font-normal text-gray-500">{right}</span>}
        </div>
      )}
      <div className={pad ? 'p-4' : ''}>{children}</div>
    </section>
  )
}

export function Tile({ label, value, sub, tone }: { label: string; value: React.ReactNode; sub?: string; tone?: 'red' | 'green' | 'amber' }) {
  const c = tone === 'red' ? 'text-red-600' : tone === 'green' ? 'text-emerald-600' : tone === 'amber' ? 'text-amber-600' : ''
  return (
    <div className="card px-4 py-3">
      <div className="text-xs text-gray-500">{label}</div>
      <div className={`mt-1 text-2xl font-semibold tabular-nums ${c}`}>{value}</div>
      {sub && <div className="mt-0.5 text-xs text-gray-500">{sub}</div>}
    </div>
  )
}

export function TrangThai({ tt }: { tt: string }) {
  const t = TRANG_THAI[tt] ?? { nhan: tt, cls: 'bg-gray-50 border-gray-300' }
  return <span className={`chip ${t.cls}`}>{t.nhan}</span>
}

export function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={`block ${className}`}>
      <span className="label">{label}</span>
      {children}
    </label>
  )
}

export function Empty({ children }: { children: React.ReactNode }) {
  return <p className="py-6 text-center text-sm text-gray-500">{children}</p>
}

export function Bar({ pct, tone = 'blue' }: { pct: number; tone?: 'blue' | 'green' | 'amber' | 'red' }) {
  const c = { blue: 'bg-brand', green: 'bg-emerald-500', amber: 'bg-amber-500', red: 'bg-red-500' }[tone]
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200">
      <div className={`h-full rounded-full ${c}`} style={{ width: `${Math.max(0, Math.min(100, pct * 100))}%` }} />
    </div>
  )
}

export function Tabs({ items }: { items: { href: string; label: string; active: boolean }[] }) {
  return (
    <div className="mb-4 flex gap-1 border-b border-gray-200">
      {items.map((t) => (
        <Link
          key={t.href}
          href={t.href}
          className={`-mb-px border-b-2 px-3 py-2 text-sm ${t.active ? 'border-brand font-semibold text-brand' : 'border-transparent text-gray-600 hover:text-gray-900'}`}
        >
          {t.label}
        </Link>
      ))}
    </div>
  )
}

export function DiUng({ text }: { text: string | null | undefined }) {
  if (!text) return null
  return <span className="chip border-red-300 bg-red-50 text-red-700">⚠ {text}</span>
}

// Dị ứng (đỏ) + tiền sử bệnh (cam): luôn hiện nổi bật ở tiếp nhận và đầu phiếu điều trị.
export function CanhBaoBN({ bn, trong = false }: { bn: { di_ung?: string | null; tien_su_benh?: string | null }; trong?: boolean }) {
  if (!bn.di_ung && !bn.tien_su_benh) {
    return trong ? <span className="chip border-emerald-300 bg-emerald-50 text-emerald-700">Không ghi nhận dị ứng / bệnh nền</span> : null
  }
  return (
    <span className="inline-flex flex-wrap gap-1">
      {bn.di_ung && <span className="chip border-red-300 bg-red-50 text-red-700">⚠ Dị ứng: {bn.di_ung}</span>}
      {bn.tien_su_benh && <span className="chip border-amber-300 bg-amber-50 text-amber-800">{bn.tien_su_benh}</span>}
    </span>
  )
}
