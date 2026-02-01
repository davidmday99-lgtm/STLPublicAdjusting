$ErrorActionPreference='Stop'
$p='C:\Users\David PC\.openclaw\workspace\STLPublicAdjusting\index.html'
$c = Get-Content -Path $p -Raw

# Replace the kicker text safely even if whitespace varies.
$before = 'Serving the St\. Louis Metro\s+Missouri\s*&\s*Illinois'
$after  = 'Serving the St. Louis Metro &bull; Missouri &amp; Illinois'

$c2 = [regex]::Replace($c, $before, $after)

# Fallback: sometimes the ampersand is already encoded or whitespace is odd.
if ($c2 -eq $c) {
  $before2 = 'Serving the St\. Louis Metro[\s\S]{0,20}?Missouri[\s\S]{0,20}?Illinois'
  $c2 = [regex]::Replace($c, $before2, $after)
}

if ($c2 -eq $c) { throw 'Kicker text not found to replace.' }
Set-Content -Path $p -Value $c2 -Encoding UTF8
Write-Host 'Updated kicker text.'
