$ErrorActionPreference = "Stop"
$appDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$url = "http://127.0.0.1:5177"
$port = 5177

function Test-MlcServer {
  try {
    $response = Invoke-WebRequest -Uri "$url/api/state" -UseBasicParsing -TimeoutSec 2
    if ($response.StatusCode -ne 200) { return $false }
    $state = $response.Content | ConvertFrom-Json
    return $null -ne $state.calendar -and $null -ne $state.settings.calendarIcsUrl
  } catch {
    return $false
  }
}

function Stop-StaleMlcServer {
  try {
    $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
    foreach ($connection in $connections) {
      $process = Get-CimInstance Win32_Process -Filter "ProcessId = $($connection.OwningProcess)" -ErrorAction SilentlyContinue
      if ($process -and $process.CommandLine -like "*masa-life-command-app*server.js*") {
        Stop-Process -Id $connection.OwningProcess -Force
      }
    }
  } catch {
    # If the stale-process check fails, fall back to normal startup error handling.
  }
}

try {
  if (-not (Test-MlcServer)) {
  Stop-StaleMlcServer
    $node = Get-Command node -ErrorAction SilentlyContinue
    if (-not $node) {
      Start-Process "https://nodejs.org/"
      exit 1
    }

    Start-Process -FilePath $node.Source -ArgumentList "server.js" -WorkingDirectory $appDir -WindowStyle Hidden

    $ready = $false
    for ($i = 0; $i -lt 30; $i++) {
      Start-Sleep -Milliseconds 400
      if (Test-MlcServer) {
        $ready = $true
        break
      }
    }

    if (-not $ready) {
      Start-Process "powershell.exe" -ArgumentList "-NoExit", "-Command", "cd '$appDir'; npm start"
      exit 1
    }
  }

  $browserCandidates = @(
    "C:\Program Files\Google\Chrome\Application\chrome.exe",
    "C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe"
  )

  $browser = $browserCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
  if ($browser) {
    Start-Process -FilePath $browser -ArgumentList @("--app=$url", "--new-window")
  } else {
    Start-Process $url
  }
} catch {
  $msg = $_.Exception.Message.Replace('"', '`"')
  Start-Process "powershell.exe" -ArgumentList "-NoExit", "-Command", "Write-Host 'Masa Life Command launch failed:'; Write-Host \"$msg\"; cd '$appDir'; npm start"
}


