import 'server-only'
import { Pool, types, type PoolClient } from 'pg'

// Trả DATE / TIMESTAMP về chuỗi (tránh lệch múi giờ khi đổi sang Date của JS),
// NUMERIC và BIGINT về number (tiền VND và số đếm đều nằm trong giới hạn an toàn).
types.setTypeParser(1082, (v) => v)
types.setTypeParser(1114, (v) => v)
types.setTypeParser(1700, (v) => Number(v))
types.setTypeParser(20, (v) => Number(v))

const g = globalThis as unknown as { __nhakhoaPool?: Pool }

export const pool =
  g.__nhakhoaPool ??
  // Múi giờ Asia/Ho_Chi_Minh được đặt ở cấp CSDL (scripts/db-init.mjs: ALTER DATABASE … SET timezone),
  // vì pooler của Neon / PgBouncer không nhận tham số khởi động `options`.
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 5,
  })

if (process.env.NODE_ENV !== 'production') g.__nhakhoaPool = pool

export async function q<T>(sql: string, params: unknown[] = []): Promise<T[]> {
  const res = await pool.query(sql, params)
  return res.rows as T[]
}

export async function q1<T>(sql: string, params: unknown[] = []): Promise<T | undefined> {
  return (await q<T>(sql, params))[0]
}

// Chạy trong một giao dịch. Đặt app.nhan_vien_id để trigger lưu vết biết ai sửa phiếu.
export async function tx<T>(nhanVienId: number, fn: (c: PoolClient) => Promise<T>): Promise<T> {
  const c = await pool.connect()
  try {
    await c.query('BEGIN')
    await c.query("SELECT set_config('app.nhan_vien_id', $1, true)", [String(nhanVienId)])
    const result = await fn(c)
    await c.query('COMMIT')
    return result
  } catch (e) {
    await c.query('ROLLBACK')
    throw e
  } finally {
    c.release()
  }
}
