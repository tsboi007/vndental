import { redirect } from 'next/navigation'

// proxy.ts đã chuyển hướng theo vai trò; đây chỉ là phương án dự phòng.
export default function Home() {
  redirect('/lich-hen')
}
