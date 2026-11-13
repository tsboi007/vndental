'use client'

export default function ErrorPage({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <div className="card mx-auto max-w-lg p-6 text-center">
      <h2 className="text-lg font-semibold">Không mở được trang này</h2>
      <p className="mt-2 text-sm text-gray-600">{error.message || 'Có lỗi xảy ra.'}</p>
      <button className="btn-sec mt-4" onClick={reset}>
        Thử lại
      </button>
    </div>
  )
}
