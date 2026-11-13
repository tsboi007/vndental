// Sinh kiểu dữ liệu của các màn hình cho frontend (frontend/src/kieu/) từ backend/src/trang/*.ts.
//   npm run sinh-kieu     (chạy lại mỗi khi đổi dữ liệu trả về của một màn hình ở backend)
// Frontend không import code backend (2 project deploy riêng) — chỉ dùng các file .d.ts sinh ra này,
// nhờ đó trang('<tên>') ở frontend có đúng kiểu backend trả về và tsc bắt lỗi khi hai bên lệch nhau.
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync, mkdirSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const be = join(dirname(fileURLToPath(import.meta.url)), '..')
const ra = join(be, '..', 'frontend', 'src', 'kieu')
const tam = mkdtempSync(join(tmpdir(), 'kieu-'))

execFileSync(process.execPath, [join(be, 'node_modules', 'typescript', 'bin', 'tsc'), '-p', be, '--declaration', '--emitDeclarationOnly', '--noEmit', 'false', '--incremental', 'false', '--outDir', tam], { stdio: 'inherit' })

rmSync(ra, { recursive: true, force: true })
mkdirSync(join(ra, 'trang'), { recursive: true })
const nguon = join(tam, 'src', 'trang')
const muc = []
for (const f of readdirSync(nguon).filter((x) => x.endsWith('.d.ts') && x !== 'index.d.ts').sort()) {
  let t = readFileSync(join(nguon, f), 'utf8')
  t = t.replace("import type { SP } from '@/lib/api';", 'type SP = Record<string, string | string[] | undefined>;')
  writeFileSync(join(ra, 'trang', f), '// TỰ SINH bởi backend/scripts/sinh-kieu.mjs — không sửa tay.\n' + t)
  const ten = f.replace('.d.ts', '')
  const ham = t.match(/export declare function (\w+)\(/)[1]
  muc.push({ ten, ham })
}
writeFileSync(
  join(ra, 'trang.ts'),
  '// TỰ SINH bởi backend/scripts/sinh-kieu.mjs — không sửa tay.\n// Kiểu dữ liệu GET /api/trang/<tên> của backend.\n' +
    muc.map((m) => `import type { ${m.ham} } from './trang/${m.ten}'`).join('\n') +
    '\n\nexport type Trang = {\n' +
    muc.map((m) => `  '${m.ten}': Awaited<ReturnType<typeof ${m.ham}>>`).join('\n') +
    '\n}\n',
)
rmSync(tam, { recursive: true, force: true })
console.log(`Đã sinh kiểu cho ${muc.length} màn hình vào frontend/src/kieu/`)
