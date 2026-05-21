# Game Ledger — start both server and client
$root = $PSScriptRoot

Write-Host "Starting API server..." -ForegroundColor Cyan
Start-Process -FilePath "node" `
  -ArgumentList "$root\server\node_modules\tsx\dist\cli.mjs $root\server\src\index.ts" `
  -WorkingDirectory "$root\server"

Start-Sleep -Seconds 2

Write-Host "Starting frontend..." -ForegroundColor Cyan
Start-Process -FilePath "node" `
  -ArgumentList "`"$root\client\node_modules\vite\bin\vite.js`"" `
  -WorkingDirectory "$root\client"

Start-Sleep -Seconds 2
Write-Host ""
Write-Host "Game Ledger running at http://localhost:5173" -ForegroundColor Green
Write-Host "API running at http://localhost:3001" -ForegroundColor Green
Start-Process "http://localhost:5173"
