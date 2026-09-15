param(
    [switch]$Stop
)

Set-StrictMode -Version Latest
$ErrorActionPreference = "Stop"

# -----------------------------
# Liquidity by Murshid settings
# -----------------------------
$ProjectRoot = "E:\LiquidityByMurshid"
$BackendDir  = Join-Path $ProjectRoot "backend"
$PythonExe   = Join-Path $BackendDir ".venv\Scripts\python.exe"

$RunDir          = Join-Path $ProjectRoot ".run"
$BackendOutLog   = Join-Path $RunDir "backend-out.log"
$BackendErrLog   = Join-Path $RunDir "backend-err.log"
$TunnelOutLog    = Join-Path $RunDir "cloudflared-out.log"
$TunnelErrLog    = Join-Path $RunDir "cloudflared-err.log"
$BackendPidFile  = Join-Path $RunDir "backend.pid"
$TunnelPidFile   = Join-Path $RunDir "cloudflared.pid"

$TunnelUrlFile   = Join-Path $ProjectRoot "CURRENT_TUNNEL_URL.txt"
$VercelUrlFile   = Join-Path $ProjectRoot "VERCEL_VITE_API_URL.txt"

New-Item -ItemType Directory -Force -Path $RunDir | Out-Null

function Stop-TrackedProcess {
    param(
        [string]$PidFile,
        [string]$Name
    )

    if (Test-Path $PidFile) {
        $savedPid = (Get-Content $PidFile -ErrorAction SilentlyContinue | Select-Object -First 1)
        if ($savedPid -match '^\d+$') {
            $proc = Get-Process -Id ([int]$savedPid) -ErrorAction SilentlyContinue
            if ($proc) {
                Write-Host "Stopping $Name (PID $savedPid)..." -ForegroundColor Yellow
                Stop-Process -Id ([int]$savedPid) -Force -ErrorAction SilentlyContinue
                Start-Sleep -Seconds 1
            }
        }
        Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
    }
}

function Test-Backend {
    try {
        $response = Invoke-RestMethod "http://127.0.0.1:8000/health" -TimeoutSec 2
        return ($response.ok -eq $true)
    }
    catch {
        return $false
    }
}

if ($Stop) {
    Stop-TrackedProcess -PidFile $TunnelPidFile  -Name "Cloudflare tunnel"
    Stop-TrackedProcess -PidFile $BackendPidFile -Name "FastAPI backend"

    Write-Host ""
    Write-Host "Liquidity backend/tunnel stopped." -ForegroundColor Green
    exit 0
}

Write-Host ""
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host " Liquidity by Murshid - Backend + Cloudflare" -ForegroundColor Cyan
Write-Host "==============================================" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $BackendDir)) {
    throw "Backend folder not found: $BackendDir"
}

if (-not (Test-Path $PythonExe)) {
    throw "Virtual environment Python not found: $PythonExe`nCreate/restore .venv first."
}

$cloudflaredCommand = Get-Command cloudflared -ErrorAction SilentlyContinue
if (-not $cloudflaredCommand) {
    throw "cloudflared is not installed or not available in PATH."
}
$CloudflaredExe = $cloudflaredCommand.Source

# Always stop the tunnel created by the previous run so each run gets a fresh URL.
Stop-TrackedProcess -PidFile $TunnelPidFile -Name "old Cloudflare tunnel"

# Start backend only if it is not already healthy.
if (Test-Backend) {
    Write-Host "[OK] Backend already running on http://127.0.0.1:8000" -ForegroundColor Green
}
else {
    Write-Host "[1/2] Starting FastAPI backend..." -ForegroundColor Cyan

    Remove-Item $BackendOutLog, $BackendErrLog -Force -ErrorAction SilentlyContinue

    $backend = Start-Process `
        -FilePath $PythonExe `
        -ArgumentList @("-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000") `
        -WorkingDirectory $BackendDir `
        -RedirectStandardOutput $BackendOutLog `
        -RedirectStandardError $BackendErrLog `
        -PassThru

    Set-Content -Path $BackendPidFile -Value $backend.Id -Encoding ascii

    $backendReady = $false
    for ($i = 0; $i -lt 30; $i++) {
        Start-Sleep -Seconds 1
        if (Test-Backend) {
            $backendReady = $true
            break
        }

        if ($backend.HasExited) {
            break
        }
    }

    if (-not $backendReady) {
        Write-Host ""
        Write-Host "Backend failed to become healthy." -ForegroundColor Red
        if (Test-Path $BackendErrLog) {
            Write-Host "---- backend error log ----" -ForegroundColor Yellow
            Get-Content $BackendErrLog -Tail 40
        }
        throw "Backend startup failed."
    }

    Write-Host "[OK] Backend healthy: http://127.0.0.1:8000/health" -ForegroundColor Green
}

Write-Host "[2/2] Starting a fresh Cloudflare Quick Tunnel..." -ForegroundColor Cyan

Remove-Item $TunnelOutLog, $TunnelErrLog -Force -ErrorAction SilentlyContinue

$tunnel = Start-Process `
    -FilePath $CloudflaredExe `
    -ArgumentList @("tunnel", "--url", "http://127.0.0.1:8000") `
    -WorkingDirectory $BackendDir `
    -RedirectStandardOutput $TunnelOutLog `
    -RedirectStandardError $TunnelErrLog `
    -PassThru

Set-Content -Path $TunnelPidFile -Value $tunnel.Id -Encoding ascii

$url = $null
$pattern = 'https://[a-z0-9-]+\.trycloudflare\.com'

for ($i = 0; $i -lt 60; $i++) {
    Start-Sleep -Seconds 1

    $text = ""
    if (Test-Path $TunnelOutLog) {
        $text += (Get-Content $TunnelOutLog -Raw -ErrorAction SilentlyContinue)
    }
    if (Test-Path $TunnelErrLog) {
        $text += "`n" + (Get-Content $TunnelErrLog -Raw -ErrorAction SilentlyContinue)
    }

    $match = [regex]::Match($text, $pattern)
    if ($match.Success) {
        $url = $match.Value
        break
    }

    if ($tunnel.HasExited) {
        break
    }
}

if (-not $url) {
    Write-Host ""
    Write-Host "Cloudflare URL could not be detected." -ForegroundColor Red
    if (Test-Path $TunnelErrLog) {
        Write-Host "---- cloudflared error log ----" -ForegroundColor Yellow
        Get-Content $TunnelErrLog -Tail 60
    }
    Stop-TrackedProcess -PidFile $TunnelPidFile -Name "failed Cloudflare tunnel"
    throw "Tunnel startup failed."
}

$apiUrl = "$url/api"

Set-Content -Path $TunnelUrlFile -Value $url -Encoding utf8
Set-Content -Path $VercelUrlFile -Value $apiUrl -Encoding utf8

try {
    Set-Clipboard -Value $apiUrl
    $clipboardMessage = "API URL copied to clipboard."
}
catch {
    $clipboardMessage = "Clipboard copy skipped."
}

Write-Host ""
Write-Host "==============================================" -ForegroundColor Green
Write-Host " READY" -ForegroundColor Green
Write-Host "==============================================" -ForegroundColor Green
Write-Host ""
Write-Host "Public backend:" -ForegroundColor White
Write-Host "  $url" -ForegroundColor Cyan
Write-Host ""
Write-Host "Vercel Environment Variable:" -ForegroundColor White
Write-Host "  VITE_API_URL=$apiUrl" -ForegroundColor Yellow
Write-Host ""
Write-Host $clipboardMessage -ForegroundColor Green
Write-Host ""
Write-Host "Saved files:" -ForegroundColor White
Write-Host "  $TunnelUrlFile"
Write-Host "  $VercelUrlFile"
Write-Host ""
Write-Host "Frontend:" -ForegroundColor White
Write-Host "  https://videotosubtitle-theta.vercel.app/" -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANT: Keep this PC online. The backend and tunnel are running as background processes." -ForegroundColor Yellow
Write-Host ""
Write-Host "To stop both processes later:" -ForegroundColor White
Write-Host "  powershell -ExecutionPolicy Bypass -File `"$PSCommandPath`" -Stop" -ForegroundColor Cyan
Write-Host ""
