import { q1, tx } from '@/lib/db'
import { run, type ActionState } from '@/lib/action'
import { bamMatKhau, kiemTraMatKhau, MAT_KHAU_TOI_THIEU } from '@/lib/mat-khau'
import { requireNhanVien, taoToken } from '@/lib/session'

// Mỗi nhân viên tự đổi mật khẩu của mình. Đổi xong: token trên máy khác hết hiệu lực,
// máy này nhận token mới trong kết quả (frontend ghi lại vào cookie).
export async function doiMatKhau(_: ActionState, fd: FormData): Promise<ActionState> {
  const nv = await requireNhanVien()
  let token = ''
  const kq = await run(async () => {
    const cu = String(fd.get('mat_khau_cu') ?? '')
    const moi = String(fd.get('mat_khau_moi') ?? '')
    if (moi.length < MAT_KHAU_TOI_THIEU) throw new Error(`Mật khẩu mới phải có ít nhất ${MAT_KHAU_TOI_THIEU} ký tự.`)
    if (moi !== String(fd.get('nhap_lai') ?? '')) throw new Error('Nhập lại mật khẩu mới chưa khớp.')
    if (moi === cu) throw new Error('Mật khẩu mới phải khác mật khẩu cũ.')
    const row = await q1<{ mat_khau_hash: string | null }>('SELECT mat_khau_hash FROM nhan_vien WHERE id = $1', [nv.id])
    if (!(await kiemTraMatKhau(cu, row?.mat_khau_hash))) throw new Error('Mật khẩu hiện tại không đúng.')
    const hash = await bamMatKhau(moi)
    await tx(nv.id, (c) => c.query('UPDATE nhan_vien SET mat_khau_hash = $1 WHERE id = $2', [hash, nv.id]))
    token = taoToken({ id: nv.id, mat_khau_hash: hash })
    return 'Đã đổi mật khẩu.'
  })
  return token ? { ...kq, token } : kq
}
