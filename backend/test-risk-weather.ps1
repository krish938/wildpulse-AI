# test-risk-weather.ps1
# Test GET /api/risk to ensure it calls weather + returns both weather & risk data

$BASE = "http://localhost:5000/api"

Write-Host ""
Write-Host "============================"
Write-Host " /api/risk Integration Test"
Write-Host "============================"
Write-Host ""

# Test: Bangalore, India
Write-Host "--- Risk + Weather: Bangalore, India ---"
try {
    $r = Invoke-WebRequest -Uri "$BASE/risk?latitude=12.9716&longitude=77.5946" -UseBasicParsing -TimeoutSec 20
    $j = $r.Content | ConvertFrom-Json
    Write-Host "success: $($j.success)"
    Write-Host ""
    Write-Host "[Weather block from /api/risk]"
    Write-Host "  temperature:    $($j.weather.temperature) C"
    Write-Host "  humidity:       $($j.weather.humidity) %"
    Write-Host "  windSpeed:      $($j.weather.windSpeed) km/h"
    Write-Host "  weatherDescription: $($j.weather.weatherDescription)"
    Write-Host ""
    Write-Host "[Risk block]"
    Write-Host "  score:      $($j.risk.score)"
    Write-Host "  level:      $($j.risk.level)"
    Write-Host "  explanation: $($j.risk.explanation)"
    Write-Host "  nearbyFireCount: $($j.nearbyFireCount)"
} catch {
    Write-Host "[FAIL] $($_.Exception.Message)"
}

Write-Host ""

# Test: direct /api/weather vs /api/risk weather block - same location
Write-Host "--- Parallel calls: /api/weather and /api/risk at same location ---"
$url_w = "$BASE/weather?latitude=34.0522&longitude=-118.2437"
$url_r = "$BASE/risk?latitude=34.0522&longitude=-118.2437"

$rw = Invoke-WebRequest -Uri $url_w -UseBasicParsing -TimeoutSec 15
$rr = Invoke-WebRequest -Uri $url_r -UseBasicParsing -TimeoutSec 15
$jw = $rw.Content | ConvertFrom-Json
$jr = $rr.Content | ConvertFrom-Json

Write-Host "/api/weather temperature: $($jw.data.temperature) C"
Write-Host "/api/risk weather temp:   $($jr.weather.temperature) C"
Write-Host "/api/risk score:          $($jr.risk.score) ($($jr.risk.level))"
Write-Host "dataSource field:         $($jw.dataSource)"
Write-Host ""

Write-Host "============================"
Write-Host " Risk + Weather tests done"
Write-Host "============================"
