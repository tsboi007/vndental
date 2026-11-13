# Gọi mọi route với cookie từng vai trò: phải 200; không cookie: phải 307 -> /dang-nhap.
param([string]$Base = 'http://localhost:3000')
$ErrorActionPreference = 'Stop'
$db = 'PhongKhamRang_dev'
function Id($sql) { (docker exec PhongKhamRangNCV psql -U sangcybersoftbvm -d $db -At -c $sql).Trim() }
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
$fail = 0
foreach ($x in $route) {
  foreach ($r in @($x.r, 'quan_ly') | Select-Object -Unique) {
    $code = curl.exe -s -o NUL -w '%{http_code}' --max-time 120 -b "nv=$($nv[$r]); vt=$r" "$Base$($x.u)"
    $ok = $code -eq '200'
    if (-not $ok) { $fail++ }
    '{0,-4} {1,-8} {2}' -f $code, $r, $x.u
  }
}
# Sai vai trò -> /khong-quyen
$sai = curl.exe -s -o NUL -w '%{http_code} %{redirect_url}' -b 'nv=5; vt=le_tan' "$Base/bao-cao"
"sai vai tro (le_tan -> /bao-cao): $sai"
foreach ($u in '/', '/lich-hen', '/bao-cao', '/phieu-dieu-tri/1') {
  $r = curl.exe -s -o NUL -w '%{http_code} %{redirect_url}' "$Base$u"
  if ($r -notmatch '^307 .*/dang-nhap') { $fail++ }
  "khong cookie $u -> $r"
}
"FAIL = $fail"
