# start.ps1 — Game Ledger dev launcher
# Starts the API server in a new console window, then runs Vite here.
# Usage: .\start.ps1

$ErrorActionPreference = 'Stop'
$Root = $PSScriptRoot

function Step($msg) { Write-Host "`n==> $msg" -ForegroundColor Cyan }

Step "Game Ledger — starting dev environment"

# ── 1. Skip server launch if :3001 is already occupied ───────────────────────
$alreadyUp = $false
try {
    $chk = [System.Net.Sockets.TcpClient]::new()
    $chk.Connect("127.0.0.1", 3001)
    $chk.Close()
    $alreadyUp = $true
    Write-Host "   Port 3001 already in use — skipping server launch" -ForegroundColor Yellow
} catch { }

if (-not $alreadyUp) {
    # ── 2. Launch API server in a new console window ──────────────────────────
    Step "Launching API server (new window)"
    $serverCmd = "Set-Location '$Root'; Write-Host '  Game Ledger API Server  ' -ForegroundColor Cyan; node server\node_modules\tsx\dist\cli.mjs server\src\index.ts"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", $serverCmd

    # ── 3. Poll until :3001 accepts connections (max 15 s) ────────────────────
    Write-Host "   Waiting for API" -NoNewline -ForegroundColor DarkGray
    $ready = $false
    for ($i = 0; $i -lt 30; $i++) {
        Start-Sleep -Milliseconds 500
        Write-Host "." -NoNewline -ForegroundColor DarkGray
        try {
            $tcp = [System.Net.Sockets.TcpClient]::new()
            $tcp.Connect("127.0.0.1", 3001)
            $tcp.Close()
            $ready = $true
            break
        } catch { }
    }

    if ($ready) {
        Write-Host " ready!" -ForegroundColor Green
    } else {
        Write-Host " timed out — starting client anyway" -ForegroundColor Yellow
    }
}

# ── 4. Run Vite in this window ────────────────────────────────────────────────
Step "Starting Vite → http://localhost:5173"
Write-Host "   (Close the server window separately when you're done)`n" -ForegroundColor DarkGray
Set-Location $Root
node client\node_modules\vite\bin\vite.js
