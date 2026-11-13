'use client'

export function PrintButton() {
  return (
    <button type="button" className="btn-sec print:hidden" onClick={() => window.print()}>
      In hóa đơn
    </button>
  )
}
