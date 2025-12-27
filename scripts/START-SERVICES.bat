@echo off
REM ===================================================
REM    🎵 MÜZIK WEBSITE - SERVICES STARTER
REM    Express + Rust Microservice
REM ===================================================

SETLOCAL ENABLEDELAYEDEXPANSION

REM Set Rust PATH
set PATH=%USERPROFILE%\.cargo\bin;%PATH%

REM Get to backend directory
cd /d "%~dp0backend"

REM Show banner
cls
echo.
echo ===================================================
echo    🚀 SERVICES BAŞLATILIYOR
echo ===================================================
echo.
echo   🟦 EXPRESS Server: http://localhost:5000
echo   🟨 RUST Service: http://127.0.0.1:8000
echo.
echo   Detaylı log için aşağıyı izleyin...
echo ===================================================
echo.

REM Start services
npm run dev:all

REM If user closes terminal
REM pause
