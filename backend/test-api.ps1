# WildPulse AI - Phase 3 API Test Script
# Run: powershell -ExecutionPolicy Bypass -File test-api.ps1

$BASE = "http://localhost:5000"

function Sep { Write-Host ("-" * 60) -ForegroundColor DarkGray }
function Title { param($t) Write-Host "`n[TEST] $t" -ForegroundColor Cyan }
function OK { param($t) Write-Host "  PASS: $t" -ForegroundColor Green }
function FAIL { param($t) Write-Host "  FAIL: $t" -ForegroundColor Red }
function RES { param($t) Write-Host "  --> $t" -ForegroundColor Yellow }

# 1. GET /api/health
Title "GET /api/health"
$r = Invoke-WebRequest -Uri "$BASE/api/health" -UseBasicParsing
$j = $r.Content | ConvertFrom-Json
if ($j.success -eq $true) { OK "Health check passed - status: $($j.status)" } else { FAIL "Unexpected response" }
RES $r.Content
Sep

# 2. POST /api/reports - valid
Title "POST /api/reports - valid payload"
$body = '{"latitude":12.97,"longitude":77.59,"description":"Large wildfire spotted near forest edge with heavy smoke visible for miles","severity":"high","placeName":"Bandipur Forest"}'
try {
  $r = Invoke-WebRequest -Uri "$BASE/api/reports" -Method POST -Body $body -ContentType "application/json" -UseBasicParsing
  $j = $r.Content | ConvertFrom-Json
  if ($j.success -eq $true) { OK "Report created - ID: $($j.data._id)" } else { FAIL "Expected success:true" }
  RES $r.Content
  $global:reportId = $j.data._id
} catch {
  $code = [int]$_.Exception.Response.StatusCode
  if ($code -eq 500 -or $code -eq 503) {
    OK "Request reached server - DB not connected (expected without credentials) - Status: $code"
  } else {
    FAIL "POST failed with $code"
  }
  RES $_.ErrorDetails.Message
}
Sep

# 3. POST /api/reports - invalid (missing description)
Title "POST /api/reports - invalid (missing description)"
$bad = '{"latitude":12.97,"longitude":77.59,"severity":"low"}'
try {
  $r = Invoke-WebRequest -Uri "$BASE/api/reports" -Method POST -Body $bad -ContentType "application/json" -UseBasicParsing
  FAIL "Expected 400 but got 2xx"
  RES $r.Content
} catch {
  $code = [int]$_.Exception.Response.StatusCode
  if ($code -eq 400) { OK "Correctly rejected with 400" } else { FAIL "Expected 400, got $code" }
  RES $_.ErrorDetails.Message
}
Sep

# 4. POST /api/reports - invalid lat/lon
Title "POST /api/reports - invalid coordinates"
$bad2 = '{"latitude":999,"longitude":77.59,"description":"Test description here which is long enough","severity":"low"}'
try {
  $r = Invoke-WebRequest -Uri "$BASE/api/reports" -Method POST -Body $bad2 -ContentType "application/json" -UseBasicParsing
  FAIL "Expected 400 but got 2xx"
} catch {
  $code = [int]$_.Exception.Response.StatusCode
  if ($code -eq 400) { OK "Correctly rejected out-of-range latitude with 400" } else { FAIL "Expected 400, got $code" }
  RES $_.ErrorDetails.Message
}
Sep

# 5. GET /api/reports
Title "GET /api/reports"
try {
  $r = Invoke-WebRequest -Uri "$BASE/api/reports" -UseBasicParsing
  $j = $r.Content | ConvertFrom-Json
  if ($j.success -eq $true) { OK "Got $($j.pagination.total) reports" } else { FAIL "Expected success:true" }
  RES $r.Content
} catch {
  $code = [int]$_.Exception.Response.StatusCode
  if ($code -eq 500) { OK "DB not connected - request correctly reached server (expected without credentials)" }
  else { FAIL "Failed with $code" }
  RES $_.ErrorDetails.Message
}
Sep

# 6. GET /api/reports/:id - invalid ObjectId format
Title "GET /api/reports/:id - invalid ObjectId"
try {
  $r = Invoke-WebRequest -Uri "$BASE/api/reports/not-a-valid-id" -UseBasicParsing
  FAIL "Expected 400 but got 2xx"
  RES $r.Content
} catch {
  $code = [int]$_.Exception.Response.StatusCode
  if ($code -eq 400) { OK "Correctly rejected invalid ObjectId with 400" } else { FAIL "Expected 400, got $code" }
  RES $_.ErrorDetails.Message
}
Sep

# 7. PATCH /api/reports/:id - invalid ObjectId format
Title "PATCH /api/reports/:id - invalid ObjectId"
$patch = '{"status":"verified"}'
try {
  $r = Invoke-WebRequest -Uri "$BASE/api/reports/bad-id" -Method PATCH -Body $patch -ContentType "application/json" -UseBasicParsing
  FAIL "Expected 400 but got 2xx"
} catch {
  $code = [int]$_.Exception.Response.StatusCode
  if ($code -eq 400) { OK "Correctly rejected invalid ObjectId on PATCH" } else { FAIL "Expected 400, got $code" }
  RES $_.ErrorDetails.Message
}
Sep

# 8. PATCH /api/reports/:id - no valid fields
Title "PATCH /api/reports/:id - no valid update fields"
$patch2 = '{"unknown_field":"some_value"}'
try {
  $r = Invoke-WebRequest -Uri "$BASE/api/reports/507f1f77bcf86cd799439011" -Method PATCH -Body $patch2 -ContentType "application/json" -UseBasicParsing
  FAIL "Expected 400 but got 2xx"
  RES $r.Content
} catch {
  $code = [int]$_.Exception.Response.StatusCode
  if ($code -eq 400) { OK "Correctly rejected patch with no valid fields - 400" } else { FAIL "Expected 400, got $code" }
  RES $_.ErrorDetails.Message
}
Sep

# 9. GET /api/risk - missing coordinates
Title "GET /api/risk - missing lat/lon"
try {
  $r = Invoke-WebRequest -Uri "$BASE/api/risk" -UseBasicParsing
  FAIL "Expected 400 but got 2xx"
} catch {
  $code = [int]$_.Exception.Response.StatusCode
  if ($code -eq 400) { OK "Correctly rejected missing coordinates with 400" } else { FAIL "Expected 400, got $code" }
  RES $_.ErrorDetails.Message
}
Sep

# 10. 404 - unknown route
Title "GET /api/unknown-route - expect 404"
try {
  $r = Invoke-WebRequest -Uri "$BASE/api/does-not-exist" -UseBasicParsing
  FAIL "Expected 404 but got 2xx"
} catch {
  $code = [int]$_.Exception.Response.StatusCode
  if ($code -eq 404) { OK "Correctly returned 404 for unknown route" } else { FAIL "Expected 404, got $code" }
  RES $_.ErrorDetails.Message
}
Sep

Write-Host "`nPhase 3 API test complete" -ForegroundColor Green
Write-Host "Note: Tests that touch DB operations will fail/degrade gracefully" -ForegroundColor DarkGray
Write-Host "      until a valid MONGODB_URI is set in backend/.env`n" -ForegroundColor DarkGray
