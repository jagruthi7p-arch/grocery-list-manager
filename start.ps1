$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")

Write-Host "Stopping existing processes..." -ForegroundColor Yellow
Stop-Process -Name "cloudflared","node" -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Write-Host "Starting backend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$root\backend'; node server.js" -WindowStyle Normal

Write-Host "Starting frontend..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit","-Command","cd '$root\frontend'; npm run dev" -WindowStyle Normal

Write-Host "Waiting for frontend to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 6

Write-Host "Starting Cloudflare tunnel..." -ForegroundColor Cyan
Remove-Item "$root\tunnel.log" -ErrorAction SilentlyContinue
Start-Process powershell -ArgumentList "-NoExit","-Command","`$env:Path=[System.Environment]::GetEnvironmentVariable('Path','Machine')+';'+[System.Environment]::GetEnvironmentVariable('Path','User'); cloudflared tunnel --url http://localhost:5173 2>&1 | Tee-Object -FilePath '$root\tunnel.log'" -WindowStyle Normal

Write-Host "Waiting for tunnel URL..." -ForegroundColor Yellow
$url = $null
for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep -Seconds 1
    $content = Get-Content "$root\tunnel.log" -ErrorAction SilentlyContinue
    $match = $content | Select-String "https://[a-z0-9\-]+\.trycloudflare\.com"
    if ($match) {
        $url = $match.Matches[0].Value
        break
    }
}

if ($url) {
    $envFile = "$root\frontend\.env"
    $envContent = Get-Content $envFile -Raw -ErrorAction SilentlyContinue
    $envContent = $envContent -replace "VITE_APP_URL=.*", "VITE_APP_URL=$url"
    [System.IO.File]::WriteAllText($envFile, $envContent)

    Write-Host ""
    Write-Host "============================================" -ForegroundColor Green
    Write-Host "  All services running!" -ForegroundColor Green
    Write-Host "  Local:  http://localhost:5173" -ForegroundColor Green
    Write-Host "  Public: $url" -ForegroundColor Green
    Write-Host "============================================" -ForegroundColor Green
    Write-Host ""
} else {
    Write-Host "Could not get tunnel URL. Check tunnel.log for errors." -ForegroundColor Red
}

Read-Host "Press Enter to close this window"
