// Tạo bảng từ db/schema.sql và (tùy chọn) nạp dữ liệu mẫu từ db/seed.sql.
//   npm run db:init           -> chỉ tạo bảng (CSDL phải trống)
//   npm run db:init -- --seed -> tạo bảng + dữ liệu mẫu
//   npm run db:reset          -> XÓA SẠCH schema public rồi tạo lại + dữ liệu mẫu
import { readFile } from 'node:fs/promises'
import pg from 'pg'

const args = new Set(process.argv.slice(2))
const reset = args.has('--reset')
const seed = reset || args.has('--seed')

if (!process.env.DATABASE_URL) {
  console.error('Thiếu DATABASE_URL. Chép .env.example thành .env.local trước.')
  process.exit(1)
}

// Neon: ưu tiên kết nối trực tiếp (không qua pooler) cho việc tạo bảng.
const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL
const client = new pg.Client({ connectionString: url })
await client.connect()

try {
  // Mọi phiên sau này (kể cả qua pooler) dùng giờ Việt Nam: current_date, now() đúng ngày.
  await client.query("SET TIME ZONE 'Asia/Ho_Chi_Minh'")
  await client.query(`DO $$ BEGIN EXECUTE format('ALTER DATABASE %I SET timezone TO %L', current_database(), 'Asia/Ho_Chi_Minh'); END $$`)
  if (reset) {
    console.log('Xóa schema public…')
    await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;')
  }
  const run = async (file) => {
    console.log(`Chạy ${file}…`)
    await client.query(await readFile(new URL(`../db/${file}`, import.meta.url), 'utf8'))
  }
  await run('schema.sql')
  if (seed) await run('seed.sql')

  // Đếm số dòng mọi bảng (không phụ thuộc tên bảng của từng dự án)
  const { rows: bang } = await client.query(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY 1",
  )
  const dem = {}
  for (const { table_name } of bang) {
    const r = await client.query(`SELECT count(*)::int AS n FROM "${table_name}"`)
    if (r.rows[0].n) dem[table_name] = r.rows[0].n
  }
  console.log(`Xong. ${bang.length} bảng.`, dem)
} catch (e) {
  console.error('Lỗi:', e.message)
  if (e.where) console.error(e.where)
  process.exitCode = 1
} finally {
  await client.end()
}
