// Đặt mật khẩu cho nhân viên từ dòng lệnh (lần đầu triển khai, hoặc khi quản lý quên mật khẩu).
//   node --env-file=.env.local scripts/dat-mat-khau.mjs <ten_dang_nhap> [mat_khau]   -> không ghi mật khẩu thì tự sinh
//   node --env-file=.env.local scripts/dat-mat-khau.mjs --chua-dat                   -> sinh cho mọi người đang làm mà chưa có mật khẩu
// CSDL lấy từ DATABASE_URL_UNPOOLED hoặc DATABASE_URL (production: vercel env pull <file> rồi --env-file=<file>).
// Định dạng hash giống src/lib/mat-khau.ts:  scrypt$N$r$p$<salt>$<hash>
import { randomBytes, randomInt, scryptSync } from 'node:crypto'
import pg from 'pg'

const N = 16384, R = 8, P = 1, LEN = 32
const bam = (pw) => {
  const salt = randomBytes(16)
  const h = scryptSync(pw.normalize('NFC'), salt, LEN, { N, r: R, p: P })
  return `scrypt$${N}$${R}$${P}$${salt.toString('base64')}$${h.toString('base64')}`
}
const KY = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const tam = () => Array.from({ length: 12 }, () => KY[randomInt(KY.length)]).join('')

const [arg, matKhau] = process.argv.slice(2)
if (!arg) {
  console.error('Cách dùng: dat-mat-khau.mjs <ten_dang_nhap> [mat_khau]  |  dat-mat-khau.mjs --chua-dat')
  process.exit(1)
}
if (matKhau && matKhau.length < 8) {
  console.error('Mật khẩu phải có ít nhất 8 ký tự.')
  process.exit(1)
}
const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL
if (!url) {
  console.error('Thiếu DATABASE_URL.')
  process.exit(1)
}

const client = new pg.Client({ connectionString: url.replace(/([?&]sslmode=)(prefer|require|verify-ca)\b/, '$1verify-full') })
await client.connect()
try {
  const ds =
    arg === '--chua-dat'
      ? (await client.query('SELECT id, ten_dang_nhap FROM nhan_vien WHERE dang_lam_viec AND mat_khau_hash IS NULL ORDER BY id')).rows
      : (await client.query('SELECT id, ten_dang_nhap FROM nhan_vien WHERE ten_dang_nhap = $1', [arg.toLowerCase()])).rows
  if (!ds.length) console.log(arg === '--chua-dat' ? 'Mọi nhân viên đang làm đều đã có mật khẩu.' : `Không có nhân viên "${arg}".`)
  for (const nv of ds) {
    const pw = matKhau || tam()
    await client.query('UPDATE nhan_vien SET mat_khau_hash = $1 WHERE id = $2', [bam(pw), nv.id])
    console.log(`${nv.ten_dang_nhap.padEnd(16)} ${pw}`)
  }
} finally {
  await client.end()
}
