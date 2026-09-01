# Test GET /api/fires
Write-Host "Testing GET /api/fires with real NASA FIRMS key..."
$r = Invoke-WebRequest -Uri "http://localhost:5000/api/fires" -UseBasicParsing -TimeoutSec 60
$j = $r.Content | ConvertFrom-Json
Write-Host ""
Write-Host "success:    $($j.success)"
Write-Host "count:      $($j.count)"
Write-Host "source:     $($j.source)"
Write-Host "dataSource: $($j.dataSource)"
Write-Host "cached:     $($j.cached)"
Write-Host "fetchedAt:  $($j.fetchedAt)"
if ($j.count -gt 0) {
  Write-Host ""
  Write-Host "--- First 3 hotspots ---"
  $j.data | Select-Object -First 3 | ConvertTo-Json -Depth 2
}
if (-not $j.success) {
  Write-Host "error: $($j.error)"
  Write-Host "configRequired: $($j.configurationRequired)"
}
