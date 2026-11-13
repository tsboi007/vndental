# Gọi mọi route với cookie từng vai trò: phải 200; không cookie: phải 307 -> /dang-nhap.
param([string]$Base = 'http://localhost:3000')
$ErrorActionPreference = 'Stop'
$db = 'PhongKhamRang_dev'
function Id($sql) { (docker exec PhongKhamRangNCV psql -U Sang_admin -d $db -At -c $sql).Trim() }
$lich = Id "SELECT id FROM lich_hen WHERE ngay = current_date ORDER BY id LIMIT 1"
$phieu = Id "SELECT id FROM phieu_dieu_tri WHERE kham_luc::date = current_date ORDER BY id LIMIT 1"
$hd = Id "SELECT max(id) FROM hoa_don"
$route = @(
  @{ u = '/lich-hen'; r = 'le_tan' }, @{ u = '/lich-hen?ngay=' + (Get-Date).AddDays(1).ToString('yyyy-MM-dd'); r = 'le_tan' },
  @{ u = '/lich-hen/dat'; r = 'le_tan' }, @{ u = '/lich-hen/dat?tim=0909000111'; r = 'le_tan' },
  @{ u = '/lich-hen/dat?bn=2&bs=1&ngay=' + (Get-Date).AddDays(1).ToString('yyyy-MM-dd'); r = 'le_tan' },
  @{ u = "/lich-hen/$lich"; r = 'le_tan' }, @{ u = '/nhac-lich'; r = 'le_tan' },
  @{ u = '/tiep-nhan'; r = 'le_tan' }, @{ u = '/tiep-nhan?sdt=0909000111'; r = 'le_tan' },
  @{ u = '/benh-nhan'; r = 'le_tan' }, @{ u = '/benh-nhan?q=Mai'; r = 'le_tan' }, @{ u = '/benh-nhan/moi'; r = 'le_tan' },
  @{ u = '/benh-nhan/2'; r = 'le_tan' }, @{ u = '/benh-nhan/4?tab=lieu_trinh'; r = 'le_tan' },
  @{ u = '/hoa-don'; r = 'le_tan' }, @{ u = "/hoa-don/$hd"; r = 'le_tan' }, @{ u = '/doi-soat'; r = 'le_tan' },
  @{ u = '/phieu-dieu-tri'; r = 'bac_si' }, @{ u = "/phieu-dieu-tri/$phieu"; r = 'bac_si' },
  @{ u = '/lieu-trinh'; r = 'bac_si' }, @{ u = '/lieu-trinh/1'; r = 'bac_si' }, @{ u = '/lieu-trinh/moi?bn=6'; r = 'bac_si' },
  @{ u = '/ca-truc'; r = 'quan_ly' }, @{ u = '/bang-gia'; r = 'quan_ly' }, @{ u = '/cong-no'; r = 'quan_ly' },
  @{ u = '/kho'; r = 'quan_ly' }, @{ u = '/bao-cao'; r = 'quan_ly' },
  @{ u = '/danh-muc'; r = 'quan_ly' }, @{ u = '/danh-muc?tab=dich_vu'; r = 'quan_ly' }, @{ u = '/danh-muc?tab=ghe'; r = 'quan_ly' }, @{ u = '/danh-muc?tab=ly_do'; r = 'quan_ly' },
  @{ u = '/khong-quyen'; r = 'le_tan' }
)
$nv = @{ le_tan = 5; bac_si = 1; quan_ly = 7 }
# Cookie phiên có chữ ký (giống src/lib/session.ts): "<id>.<het>.<HMAC-SHA256(SESSION_SECRET, id.het.mat_khau_hash)>"
$secret = ((Get-Content (Join-Path $PSScriptRoot '..\.env.local') -Encoding UTF8 | Where-Object { $_ -match '^SESSION_SECRET=' }) -split '=', 2)[1]
if (-not $secret) { throw 'Thieu SESSION_SECRET trong .env.local' }
function Phien($id) {
  $hash = Id "SELECT mat_khau_hash FROM nhan_vien WHERE id = $id"
  if (-not $hash) { $hash = 'smoke-' + [guid]::NewGuid(); docker exec PhongKhamRangNCV psql -U Sang_admin -d $db -q -c "UPDATE nhan_vien SET mat_khau_hash = '$hash' WHERE id = $id" | Out-Null }
  $het = [DateTimeOffset]::UtcNow.ToUnixTimeSeconds() + 3600
  $h = New-Object System.Security.Cryptography.HMACSHA256 (,[Text.Encoding]::UTF8.GetBytes($secret))
  $sig = [Convert]::ToBase64String($h.ComputeHash([Text.Encoding]::UTF8.GetBytes("$id.$het.$hash"))).TrimEnd('=').Replace('+', '-').Replace('/', '_')
  "$id.$het.$sig"
}
$ck = @{}; foreach ($k in @($nv.Keys)) { $ck[$k] = Phien $nv[$k] }
$fail = 0
foreach ($x in $route) {
  foreach ($r in @($x.r, 'quan_ly') | Select-Object -Unique) {
    $code = curl.exe -s -o NUL -w '%{http_code}' --max-time 120 -b "nv=$($ck[$r]); vt=$r" "$Base$($x.u)"
    $ok = $code -eq '200'
    if (-not $ok) { $fail++ }
    '{0,-4} {1,-8} {2}' -f $code, $r, $x.u
  }
}
# Sai vai trò -> /khong-quyen
# (Trang stream trong Suspense: redirect nằm trong nội dung trả về "NEXT_REDIRECT;replace;<đích>", mã HTTP vẫn 200.)
$body = (curl.exe -s --max-time 120 -b "nv=$($ck.le_tan); vt=le_tan" "$Base/bao-cao") -join "`n"
$ok = $body -match 'NEXT_REDIRECT;replace;/khong-quyen'
if (-not $ok) { $fail++ }
"sai vai tro (le_tan -> /bao-cao) -> /khong-quyen: $ok"
# Cookie tự sửa (không chữ ký / sai chữ ký) -> phải bị đẩy về /dang-nhap
foreach ($gia in "nv=7; vt=quan_ly", "nv=7.9999999999.abc; vt=quan_ly") {
  $body = (curl.exe -s --max-time 120 -b $gia "$Base/bao-cao") -join "`n"
  $ok = $body -match 'NEXT_REDIRECT;replace;/dang-nhap'
  if (-not $ok) { $fail++ }
  "cookie gia ($gia) -> /dang-nhap: $ok"
}
foreach ($u in '/', '/lich-hen', '/bao-cao', '/phieu-dieu-tri/1') {
  $r = curl.exe -s -o NUL -w '%{http_code} %{redirect_url}' "$Base$u"
  if ($r -notmatch '^307 .*/dang-nhap') { $fail++ }
  "khong cookie $u -> $r"
}
"FAIL = $fail"
