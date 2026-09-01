# test-weather.ps1
# Full test suite for GET /api/weather (Open-Meteo integration)
# Tests: valid coordinates, missing params, invalid params, out-of-range coords

$BASE = "http://localhost:5000/api"

function Test-Endpoint {
    param([string]$Name, [string]$Url, [int]$ExpectedStatus)
    try {
        $r = Invoke-WebRequest -Uri $Url -UseBasicParsing -TimeoutSec 15 -ErrorAction SilentlyContinue
        $code = $r.StatusCode
    } catch {
        $code = $_.Exception.Response.StatusCode.value__
        if (-not $code) { $code = 0 }
    }
    $mark = if ($code -eq $ExpectedStatus) { "PASS" } else { "FAIL (got $code, expected $ExpectedStatus)" }
    Write-Host "[$mark] $Name"
    if ($code -eq $ExpectedStatus) {
        return $true
    }
    return $false
}

Write-Host ""
Write-Host "============================"
Write-Host " /api/weather Test Suite"
Write-Host "============================"
Write-Host ""

# Test 1: Valid coordinates - Bangalore, India
Write-Host "--- Test 1: Valid coords (Bangalore, India) ---"
try {
    $r = Invoke-WebRequest -Uri "$BASE/weather?latitude=12.9716&longitude=77.5946" -UseBasicParsing -TimeoutSec 15
    $j = $r.Content | ConvertFrom-Json
    Write-Host "[PASS] HTTP 200"
    Write-Host "  success:            $($j.success)"
    Write-Host "  dataSource:         $($j.dataSource)"
    Write-Host "  temperature:        $($j.data.temperature) C"
    Write-Host "  feelsLike:          $($j.data.feelsLike) C"
    Write-Host "  humidity:           $($j.data.humidity) %"
    Write-Host "  windSpeed:          $($j.data.windSpeed) km/h"
    Write-Host "  windDirection:      $($j.data.windDirection) degrees"
    Write-Host "  precipitation:      $($j.data.precipitation) mm"
    Write-Host "  weatherCode:        $($j.data.weatherCode)"
    Write-Host "  weatherDescription: $($j.data.weatherDescription)"
    Write-Host "  weatherCategory:    $($j.data.weatherCategory)"
    Write-Host "  timestamp:          $($j.data.timestamp)"
    Write-Host "  timezone:           $($j.data.timezone)"
} catch {
    Write-Host "[FAIL] $($_.Exception.Message)"
}

Write-Host ""

# Test 2: Valid coordinates - Los Angeles, USA
Write-Host "--- Test 2: Valid coords (Los Angeles, USA) ---"
try {
    $r = Invoke-WebRequest -Uri "$BASE/weather?latitude=34.0522&longitude=-118.2437" -UseBasicParsing -TimeoutSec 15
    $j = $r.Content | ConvertFrom-Json
    Write-Host "[PASS] HTTP 200 | Temp: $($j.data.temperature)C | Desc: $($j.data.weatherDescription)"
} catch {
    Write-Host "[FAIL] $($_.Exception.Message)"
}

Write-Host ""

# Test 3: Valid coords - Amazon, Brazil (fire-prone)
Write-Host "--- Test 3: Valid coords (Amazon, Brazil) ---"
try {
    $r = Invoke-WebRequest -Uri "$BASE/weather?latitude=-3.4653&longitude=-62.2159" -UseBasicParsing -TimeoutSec 15
    $j = $r.Content | ConvertFrom-Json
    Write-Host "[PASS] HTTP 200 | Temp: $($j.data.temperature)C | Wind: $($j.data.windSpeed) km/h | Humidity: $($j.data.humidity)%"
} catch {
    Write-Host "[FAIL] $($_.Exception.Message)"
}

Write-Host ""

# Test 4: Missing latitude
Write-Host "--- Test 4: Missing latitude (expect 400) ---"
try {
    $r = Invoke-WebRequest -Uri "$BASE/weather?longitude=77.5946" -UseBasicParsing -TimeoutSec 10 -ErrorAction SilentlyContinue
    $j = $r.Content | ConvertFrom-Json
    if ($r.StatusCode -eq 400) { Write-Host "[PASS] HTTP 400 | error: $($j.error)" }
    else                        { Write-Host "[FAIL] Expected 400, got $($r.StatusCode)" }
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code -eq 400) {
        Write-Host "[PASS] HTTP 400 returned correctly"
    } else {
        Write-Host "[FAIL] Got $code - $($_.Exception.Message)"
    }
}

Write-Host ""

# Test 5: Missing longitude
Write-Host "--- Test 5: Missing longitude (expect 400) ---"
try {
    $r = Invoke-WebRequest -Uri "$BASE/weather?latitude=12.9716" -UseBasicParsing -TimeoutSec 10 -ErrorAction SilentlyContinue
    $j = $r.Content | ConvertFrom-Json
    if ($r.StatusCode -eq 400) { Write-Host "[PASS] HTTP 400 | error: $($j.error)" }
    else                        { Write-Host "[FAIL] Expected 400, got $($r.StatusCode)" }
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code -eq 400) {
        Write-Host "[PASS] HTTP 400 returned correctly"
    } else {
        Write-Host "[FAIL] Got $code - $($_.Exception.Message)"
    }
}

Write-Host ""

# Test 6: Out-of-range latitude
Write-Host "--- Test 6: latitude=999 out of range (expect 400) ---"
try {
    $r = Invoke-WebRequest -Uri "$BASE/weather?latitude=999&longitude=77.59" -UseBasicParsing -TimeoutSec 10 -ErrorAction SilentlyContinue
    $j = $r.Content | ConvertFrom-Json
    if ($r.StatusCode -eq 400) { Write-Host "[PASS] HTTP 400 | error: $($j.error)" }
    else                        { Write-Host "[FAIL] Expected 400, got $($r.StatusCode)" }
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code -eq 400) {
        Write-Host "[PASS] HTTP 400 returned correctly"
    } else {
        Write-Host "[FAIL] Got $code - $($_.Exception.Message)"
    }
}

Write-Host ""

# Test 7: Non-numeric latitude
Write-Host "--- Test 7: latitude=abc non-numeric (expect 400) ---"
try {
    $r = Invoke-WebRequest -Uri "$BASE/weather?latitude=abc&longitude=77.59" -UseBasicParsing -TimeoutSec 10 -ErrorAction SilentlyContinue
    $j = $r.Content | ConvertFrom-Json
    if ($r.StatusCode -eq 400) { Write-Host "[PASS] HTTP 400 | error: $($j.error)" }
    else                        { Write-Host "[FAIL] Expected 400, got $($r.StatusCode)" }
} catch {
    $code = $_.Exception.Response.StatusCode.value__
    if ($code -eq 400) {
        Write-Host "[PASS] HTTP 400 returned correctly"
    } else {
        Write-Host "[FAIL] Got $code - $($_.Exception.Message)"
    }
}

Write-Host ""
Write-Host "============================"
Write-Host " All weather tests complete"
Write-Host "============================"
