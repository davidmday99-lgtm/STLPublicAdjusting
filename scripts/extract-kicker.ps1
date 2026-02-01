$ErrorActionPreference='Stop'
$p='C:\Users\David PC\.openclaw\workspace\STLPublicAdjusting\index.html'
$m = Select-String -Path $p -Pattern '\.kicker\{' -Context 0,12 | Select-Object -First 1
Write-Output "--- .kicker CSS ---"
Write-Output ($m.Line)
$m.Context.PostContext | ForEach-Object { Write-Output $_ }

$m2 = Select-String -Path $p -Pattern 'Serving the St\. Louis Metro' -Context 0,2 | Select-Object -First 1
Write-Output "--- kicker HTML ---"
Write-Output ($m2.Line)
