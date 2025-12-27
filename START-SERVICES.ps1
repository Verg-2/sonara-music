#!/usr/bin/env pwsh
# ===================================================
#    MUZIK WEBSITE - DUAL SERVICE LAUNCHER
#    Express (5000) + Rust (8000)
# ===================================================

param(
    [switch]$NoTest = $false
)

$ErrorActionPreference = "Stop"

$backendPath = Join-Path $PSScriptRoot "backend"
$rustPath = Join-Path $PSScriptRoot "rust-service"

# Set Rust PATH
$env:Path = "$Env:USERPROFILE\.cargo\bin;" + $env:Path

Write-Host "`n================================================" -ForegroundColor Green
Write-Host "     MUZIK WEBSITE - SERVICES LAUNCHER     " -ForegroundColor Green
Write-Host "================================================`n" -ForegroundColor Green

Write-Host "[INFO] Backend Yolu: $backendPath" -ForegroundColor Cyan
Write-Host "[INFO] Rust Yolu: $rustPath`n" -ForegroundColor Cyan

if (-not (Test-Path $backendPath)) {
    Write-Host "[ERROR] Backend dizini bulunamadı: $backendPath" -ForegroundColor Red
    exit 1
}

if (-not (Test-Path $rustPath)) {
    Write-Host "[ERROR] Rust dizini bulunamadı: $rustPath" -ForegroundColor Red
    exit 1
}

Write-Host "[OK] Dizinler kontrol edildi`n" -ForegroundColor Green

Write-Host "================================================" -ForegroundColor Yellow
Write-Host "PORT BILGISI:" -ForegroundColor Yellow
Write-Host "  [EXPRESS] http://localhost:5000" -ForegroundColor Cyan
Write-Host "  [RUST]    http://127.0.0.1:8000" -ForegroundColor Yellow
Write-Host "================================================`n" -ForegroundColor Yellow

# Check if ports are already in use
Write-Host "[CHECK] Port kontrolu yapiliyor..." -ForegroundColor Yellow

$expressPortInUse = $false
$rustPortInUse = $false

try {
    $expressCheck = Test-NetConnection -ComputerName localhost -Port 5000 -WarningAction SilentlyContinue -InformationLevel Quiet -ErrorAction SilentlyContinue
    if ($expressCheck) {
        Write-Host "[WARN] Port 5000 zaten kullaniliyor!" -ForegroundColor Yellow
        $expressPortInUse = $true
    }
} catch {
    # Port is free
}

try {
    $rustCheck = Test-NetConnection -ComputerName 127.0.0.1 -Port 8000 -WarningAction SilentlyContinue -InformationLevel Quiet -ErrorAction SilentlyContinue
    if ($rustCheck) {
        Write-Host "[WARN] Port 8000 zaten kullaniliyor!" -ForegroundColor Yellow
        $rustPortInUse = $true
    }
} catch {
    # Port is free
}

if ($expressPortInUse -or $rustPortInUse) {
    Write-Host "[INFO] Mevcut servisler kullanilacak veya portlar temizlenecek`n" -ForegroundColor Cyan
}

Write-Host "[INFO] Servisler baslatiliyor..." -ForegroundColor Green
Write-Host "[INFO] Ctrl+C ile durdurabilirsiniz`n" -ForegroundColor Cyan

Set-Location $backendPath

# Start both services using concurrently
try {
    npm run dev:all
} catch {
    Write-Host "`n[ERROR] Servisler baslatilamadi: $_" -ForegroundColor Red
    Write-Host "[INFO] Tek tek baslatmayi deneyin:" -ForegroundColor Yellow
    Write-Host "  1. Terminal 1: cd backend && npm run dev" -ForegroundColor Cyan
    Write-Host "  2. Terminal 2: cd rust-service && cargo run" -ForegroundColor Cyan
    exit 1
}

Write-Host "`n[INFO] Servisler durduruldu" -ForegroundColor Red
