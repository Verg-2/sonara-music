#!/usr/bin/env pwsh
# ===================================================
#    MUZIK WEBSITE - TEST SUITE
# ===================================================

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "       SERVICES TEST SUITE              " -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:5000"
$rustUrl = "http://127.0.0.1:8000"
$results = @()

# Test 1: Express Root
Write-Host "1. Testing Express ROOT endpoint..." -ForegroundColor Yellow
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   [OK] Status: 200 OK" -ForegroundColor Green
    Write-Host "   [OK] Message: $($result.message)" -ForegroundColor Green
    Write-Host "   [OK] Version: $($result.version)" -ForegroundColor Green
    $results += "Root: PASS"
} catch {
    Write-Host "   [FAIL] FAILED: $_" -ForegroundColor Red
    $results += "Root: FAIL"
}

# Test 2: Artists Endpoint
Write-Host "`n2. Testing /api/artists endpoint..." -ForegroundColor Yellow
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/api/artists?limit=1" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   [OK] Status: 200 OK" -ForegroundColor Green
    Write-Host "   [OK] Count: $($result.count)" -ForegroundColor Green
    Write-Host "   [OK] Total: $($result.total)" -ForegroundColor Green
    $results += "Artists: PASS"
} catch {
    Write-Host "   [FAIL] FAILED: $_" -ForegroundColor Red
    $results += "Artists: FAIL"
}

# Test 3: Rust Hello (Direct)
Write-Host "`n3. Testing Rust /hello endpoint (Direct)..." -ForegroundColor Yellow
try {
    $result = Invoke-RestMethod -Uri "$rustUrl/api/rust/hello" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   [OK] Status: 200 OK" -ForegroundColor Green
    Write-Host "   [OK] Service: $($result.service)" -ForegroundColor Green
    Write-Host "   [OK] Status: $($result.status)" -ForegroundColor Green
    Write-Host "   [OK] Timestamp: $($result.time)" -ForegroundColor Green
    $results += "Rust Hello: PASS"
} catch {
    Write-Host "   [FAIL] FAILED: $_" -ForegroundColor Red
    $results += "Rust Hello: FAIL"
}

# Test 4: Rust Hello (via Express Proxy)
Write-Host "`n4. Testing Rust /hello endpoint (via Express Proxy)..." -ForegroundColor Yellow
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/api/rust/hello" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   [OK] Status: 200 OK" -ForegroundColor Green
    Write-Host "   [OK] Service: $($result.service)" -ForegroundColor Green
    Write-Host "   [OK] Timestamp: $($result.time)" -ForegroundColor Green
    $results += "Rust Hello (Proxy): PASS"
} catch {
    Write-Host "   [FAIL] FAILED: $_" -ForegroundColor Red
    $results += "Rust Hello (Proxy): FAIL"
}

# Test 5: Rust Hash Endpoint
Write-Host "`n5. Testing Rust /hash endpoint (via Express Proxy)..." -ForegroundColor Yellow
try {
    $result = Invoke-RestMethod -Uri "$baseUrl/api/rust/hash?data=test123" -TimeoutSec 5 -ErrorAction Stop
    Write-Host "   [OK] Status: 200 OK" -ForegroundColor Green
    Write-Host "   [OK] Algorithm: $($result.algo)" -ForegroundColor Green
    Write-Host "   [OK] Input Length: $($result.len)" -ForegroundColor Green
    Write-Host "   [OK] Hash (first 20 chars): $($result.hash_hex.Substring(0, 20))..." -ForegroundColor Green
    $results += "Rust Hash: PASS"
} catch {
    Write-Host "   [FAIL] FAILED: $_" -ForegroundColor Red
    $results += "Rust Hash: FAIL"
}

# Test 6: Security Headers
Write-Host "`n6. Testing Security Headers..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$baseUrl/api/artists" -TimeoutSec 5 -ErrorAction Stop
    $hasHelmet = $response.Headers.Keys -contains "X-Content-Type-Options"
    $hasCors = $response.Headers.Keys -contains "Access-Control-Allow-Origin"
    
    if ($hasHelmet) {
        Write-Host "   [OK] Helmet.js headers detected" -ForegroundColor Green
        Write-Host "      - X-Content-Type-Options: $($response.Headers['X-Content-Type-Options'])" -ForegroundColor Green
    } else {
        Write-Host "   [WARN] Helmet.js headers not detected" -ForegroundColor Yellow
    }
    
    if ($hasCors) {
        Write-Host "   [OK] CORS headers present" -ForegroundColor Green
    }
    
    $results += "Security Headers: PASS"
} catch {
    Write-Host "   [FAIL] FAILED: $_" -ForegroundColor Red
    $results += "Security Headers: FAIL"
}

# Summary
Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "              TEST SUMMARY              " -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

foreach ($result in $results) {
    if ($result.Contains("PASS")) {
        Write-Host "   [PASS] $result" -ForegroundColor Green
    } else {
        Write-Host "   [FAIL] $result" -ForegroundColor Red
    }
}

$passCount = ($results | Where-Object { $_.Contains("PASS") }).Count
$failCount = ($results | Where-Object { $_.Contains("FAIL") }).Count

Write-Host "`nTOTAL: $passCount PASSED, $failCount FAILED out of $($results.Count) tests`n" -ForegroundColor Cyan

if ($failCount -eq 0) {
    Write-Host "ALL TESTS PASSED! Services are running correctly.`n" -ForegroundColor Green
} else {
    Write-Host "Some tests failed. Check service logs.`n" -ForegroundColor Yellow
}
