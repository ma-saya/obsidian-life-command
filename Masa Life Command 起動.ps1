$ErrorActionPreference = "Stop"
$appDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$url = "http://localhost:5177"
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

if (-not (Test-MlcServer)) {
  Stop-StaleMlcServer
  $node = Get-Command node -ErrorAction SilentlyContinue
  if (-not $node) {
    [System.Windows.MessageBox]::Show("Node.js が見つかりません。先に Node.js をインストールしてください。", "Masa Life Command") | Out-Null
    exit 1
  }

  Start-Process -FilePath $node.Source -ArgumentList "server.js" -WorkingDirectory $appDir -WindowStyle Hidden

  $ready = $false
  for ($i = 0; $i -lt 20; $i++) {
    Start-Sleep -Milliseconds 400
    if (Test-MlcServer) {
      $ready = $true
      break
    }
  }

  if (-not $ready) {
    [System.Windows.MessageBox]::Show("Masa Life Command の起動に失敗しました。`n$appDir で npm start を確認してください。", "Masa Life Command") | Out-Null
    exit 1
  }
}

$chromeCandidates = @(
  "C:\Program Files\Google\Chrome\Application\chrome.exe",
  "C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
  "C:\Program Files\Microsoft\Edge\Application\msedge.exe"
)

$browser = $chromeCandidates | Where-Object { Test-Path $_ } | Select-Object -First 1
if ($browser) {
  Start-Process -FilePath $browser -ArgumentList "--app=$url"
} else {
  Start-Process $url
}

