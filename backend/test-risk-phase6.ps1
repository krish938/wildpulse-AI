# test-risk-phase6.ps1
# Phase 6 end-to-end test suite for the wildfire risk prediction engine

$BASE = "http://localhost:5000/api"

function Invoke-RiskGet {
    param([double]$Lat, [double]$Lon, [int]$TimeoutSec = 30)
    $uri = "$BASE/risk"
    return Invoke-RestMethod -Uri $uri -Method GET `
        -Body @{ latitude = $Lat; longitude = $Lon } `
        -TimeoutSec $TimeoutSec
}

function Invoke-RiskPost {
    param([double]$Lat, [double]$Lon, [int]$TimeoutSec = 30)
    $body = @{ latitude = $Lat; longitude = $Lon } | ConvertTo-Json
    return Invoke-RestMethod -Uri "$BASE/risk" -Method POST `
        -Body $body -ContentType "application/json" -TimeoutSec $TimeoutSec
}

Write-Host ""
Write-Host "============================================"
Write-Host "  Phase 6 - Risk Engine End-to-End Tests"
Write-Host "============================================"
Write-Host ""

# ── Test 1: GET /api/risk — Bangalore, India ──────────────────────────────────
Write-Host "--- Test 1: GET /api/risk (Bangalore, India) ---"
try {
    $j = Invoke-RiskGet -Lat 12.9716 -Lon 77.5946
    Write-Host "[PASS] HTTP 200"
    Write-Host "  success:          $($j.success)"
    Write-Host "  risk.score:       $($j.risk.score)"
    Write-Host "  risk.level:       $($j.risk.level)"
    Write-Host "  risk.confidence:  $($j.risk.confidence)"
    Write-Host "  risk.explanation: $($j.risk.explanation)"
    Write-Host "  nearbyFireCount:  $($j.nearbyFireCount)"
    Write-Host "  nearbyFireRadius: $($j.nearbyFireRadius) km"
    Write-Host "  weather.temp:     $($j.weather.temperature) C"
    Write-Host "  factorBreakdown:  $($j.risk.factorBreakdown.Count) factors"
    Write-Host "  factors:          $($j.risk.factors.Count) bullets"
    Write-Host "  modelType:        $($j.risk.modelType)"
    Write-Host ""
    Write-Host "  Factor Breakdown:"
    foreach ($f in $j.risk.factorBreakdown) {
        $line = "    $($f.label.PadRight(16)) score=$($f.score.ToString().PadLeft(3))  impact=$($f.impact.PadRight(8))  value=$($f.value)"
        Write-Host $line
    }
} catch {
    Write-Host "[FAIL] $($_.Exception.Message)"
}

Write-Host ""

# ── Test 2: POST /api/risk — Los Angeles, CA ─────────────────────────────────
Write-Host "--- Test 2: POST /api/risk (Los Angeles, CA) ---"
try {
    $j = Invoke-RiskPost -Lat 34.0522 -Lon -118.2437
    Write-Host "[PASS] HTTP 200"
    Write-Host "  score: $($j.risk.score) | level: $($j.risk.level) | confidence: $($j.risk.confidence)"
    Write-Host "  temp: $($j.weather.temperature)C | humidity: $($j.weather.humidity)%"
    Write-Host "  dataSource.weather: $($j.dataSource.weather)"
    Write-Host "  dataSource.fires:   $($j.dataSource.fires)"
} catch {
    Write-Host "[FAIL] $($_.Exception.Message)"
}

Write-Host ""

# ── Test 3: Amazon, Brazil — fire-prone region ───────────────────────────────
Write-Host "--- Test 3: Amazon, Brazil (fire-prone area) ---"
try {
    $j = Invoke-RiskGet -Lat -3.4653 -Lon -62.2159
    Write-Host "[PASS] HTTP 200"
    Write-Host "  score: $($j.risk.score) | level: $($j.risk.level)"
    Write-Host "  nearbyFireCount: $($j.nearbyFireCount)"
    if ($j.risk.fireStats) {
        Write-Host "  fireStats.count:     $($j.risk.fireStats.count)"
        Write-Host "  fireStats.avgFRP:    $($j.risk.fireStats.avgFRP)"
        Write-Host "  fireStats.maxFRP:    $($j.risk.fireStats.maxFRP)"
        Write-Host "  fireStats.highConf:  $($j.risk.fireStats.highConfCount)"
    }
    Write-Host ""
    Write-Host "  Why this risk:"
    foreach ($f in $j.risk.factors) {
        Write-Host "    - $f"
    }
} catch {
    Write-Host "[FAIL] $($_.Exception.Message)"
}

Write-Host ""

# ── Test 4: Validation — missing latitude ────────────────────────────────────
Write-Host "--- Test 4: Missing latitude (expect 400) ---"
try {
    $r = Invoke-WebRequest -Uri "$BASE/risk?longitude=77.59" -UseBasicParsing -TimeoutSec 10 -ErrorAction SilentlyContinue
    Write-Host "[FAIL] Expected 400, got $($r.StatusCode)"
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code -eq 400) { Write-Host "[PASS] HTTP 400 returned correctly" }
    else { Write-Host "[FAIL] Got $code" }
}

Write-Host ""

# ── Test 5: Validation — out-of-range latitude ───────────────────────────────
Write-Host "--- Test 5: latitude=999 out-of-range (expect 400) ---"
try {
    $j = Invoke-RiskGet -Lat 999 -Lon 77.59
    Write-Host "[FAIL] Expected error, got score $($j.risk.score)"
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code -eq 400) { Write-Host "[PASS] HTTP 400 returned correctly" }
    else { Write-Host "[FAIL] Got $code — $($_.Exception.Message)" }
}

Write-Host ""
Write-Host "============================================"
Write-Host "  All Phase 6 tests complete"
Write-Host "============================================"
