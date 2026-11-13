import type { NextConfig } from 'next'

// Backend chỉ có API (src/app/api/**), không có trang giao diện.
const nextConfig: NextConfig = {
  poweredByHeader: false,
}

export default nextConfig
