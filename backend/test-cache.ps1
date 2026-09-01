# Test caching - second call should be instantaneous and return cached:true
$r = Invoke-WebRequest -Uri "http://localhost:5000/api/fires" -UseBasicParsing -TimeoutSec 15
$j = $r.Content | ConvertFrom-Json
Write-Host "Second call (should be cached):"
Write-Host "success:   $($j.success)"
Write-Host "count:     $($j.count)"
Write-Host "cached:    $($j.cached)"
Write-Host "fetchedAt: $($j.fetchedAt)"
Write-Host "cacheExpires: $($j.cacheExpiresAt)"
