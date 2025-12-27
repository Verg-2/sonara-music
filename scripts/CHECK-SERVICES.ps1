#!/usr/bin/env pwsh
# ===================================================
#    CHECK SERVICES STATUS
# ===================================================

$ErrorActionPreference = "Continue"

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "       CHECKING SERVICES STATUS              " -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

$expressUrl = "http://localhost:5000"
$rustUrl = "http://127.0.0.1:8000"

$expressRunning = $false
$rustRunning = $false

# Check Express
Write-Host "[CHECK] Express Server (Port 5000)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$expressUrl/" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "[OK] Express Server is RUNNING" -ForegroundColor Green
        Write-Host "     URL: $expressUrl" -ForegroundColor Cyan
        $expressRunning = $true
    }
} catch {
    Write-Host "[FAIL] Express Server is NOT running" -ForegroundColor Red
    Write-Host "       Error: $_" -ForegroundColor Red
}

Write-Host ""

# Check Rust
Write-Host "[CHECK] Rust Service (Port 8000)..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "$rustUrl/api/rust/hello" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "[OK] Rust Service is RUNNING" -ForegroundColor Green
        Write-Host "     URL: $rustUrl" -ForegroundColor Cyan
        $rustRunning = $true
    }
} catch {
    Write-Host "[FAIL] Rust Service is NOT running" -ForegroundColor Red
    Write-Host "       Error: $_" -ForegroundColor Red
}

Write-Host "`n================================================" -ForegroundColor Cyan
Write-Host "              SUMMARY              " -ForegroundColor Cyan
Write-Host "================================================`n" -ForegroundColor Cyan

if ($expressRunning -and $rustRunning) {
    Write-Host "[SUCCESS] Both services are running!" -ForegroundColor Green
    Write-Host "  - Express: $expressUrl" -ForegroundColor Cyan
    Write-Host "  - Rust: $rustUrl" -ForegroundColor Yellow
    Write-Host "`n[INFO] Website should work at full speed!`n" -ForegroundColor Green
    exit 0
} elseif ($expressRunning) {
    Write-Host "[PARTIAL] Only Express is running" -ForegroundColor Yellow
    Write-Host "  - Express: $expressUrl [OK]" -ForegroundColor Green
    Write-Host "  - Rust: $rustUrl [NOT RUNNING]" -ForegroundColor Red
    Write-Host "`n[INFO] Start Rust service for better performance:`n" -ForegroundColor Yellow
    Write-Host "  cd rust-service" -ForegroundColor Cyan
    Write-Host "  cargo run`n" -ForegroundColor Cyan
    exit 1
} elseif ($rustRunning) {
    Write-Host "[PARTIAL] Only Rust is running" -ForegroundColor Yellow
    Write-Host "  - Express: $expressUrl [NOT RUNNING]" -ForegroundColor Red
    Write-Host "  - Rust: $rustUrl [OK]" -ForegroundColor Green
    Write-Host "`n[INFO] Start Express service:`n" -ForegroundColor Yellow
    Write-Host "  cd backend" -ForegroundColor Cyan
    Write-Host "  npm run dev`n" -ForegroundColor Cyan
    exit 1
} else {
    Write-Host "[ERROR] No services are running!" -ForegroundColor Red
    Write-Host "`n[INFO] Start both services:`n" -ForegroundColor Yellow
    Write-Host "  PowerShell -ExecutionPolicy Bypass -File START-SERVICES.ps1`n" -ForegroundColor Cyan
    exit 1
}


