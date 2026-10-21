# Silent NSIS smoke test for disposable Windows CI runners.
$ErrorActionPreference = 'Stop'
$version = (Get-Content (Join-Path $PSScriptRoot '..\package.json') -Raw | ConvertFrom-Json).version
$installer = (Resolve-Path (Join-Path $PSScriptRoot "..\release\FileHub-Setup-$version.exe")).Path
$installDir = Join-Path $env:RUNNER_TEMP "FileHubInstallerSmoke-$PID"
$appExe = Join-Path $installDir 'FileHub.exe'
$agentExe = Join-Path $installDir 'resources\agent\FileHub.EtwAgent.exe'
$extensionManifest = Join-Path $installDir 'resources\extension\manifest.json'
$hostManifest = Join-Path $env:LOCALAPPDATA 'FileHub\com.springit.filehub.json'
$keys = @(
 'HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.springit.filehub',
 'HKCU:\Software\Microsoft\Edge\NativeMessagingHosts\com.springit.filehub'
)
$uninstalled = $false

function Invoke-Installer([string]$Executable, [string[]]$Arguments) {
  $p = Start-Process -FilePath $Executable -ArgumentList $Arguments -PassThru -Wait
  if ($p.ExitCode -ne 0) { throw "$Executable exited with code $($p.ExitCode)" }
}

try {
  Write-Host "Installing $installer silently into $installDir"
  Invoke-Installer $installer @('/S', "/D=$installDir")

  foreach ($path in @($appExe, $agentExe, $extensionManifest, $hostManifest)) {
    if (-not (Test-Path -LiteralPath $path)) { throw "Installed file is missing: $path" }
  }

  $manifest = Get-Content -LiteralPath $hostManifest -Raw | ConvertFrom-Json
  if ($manifest.name -ne 'com.springit.filehub') { throw 'Native Messaging host name is wrong' }
  if ($manifest.path -ne $appExe) { throw "Host EXE path mismatch: $($manifest.path)" }
  if ($manifest.type -ne 'stdio') { throw 'Native Messaging host type must be stdio' }
  if ($manifest.allowed_origins -notcontains 'chrome-extension://ifofkigafdeojcgajpdpdheimllpkjml/') {
    throw 'Native Messaging extension origin is not authorized'
  }

  foreach ($key in $keys) {
    if (-not (Test-Path $key)) { throw "Native Messaging registry key missing: $key" }
    $value = (Get-Item $key).GetValue('')
    if ($value -ne $hostManifest) { throw "Registry entry mismatch: $key -> $value" }
  }

  $uninstaller = Get-ChildItem -LiteralPath $installDir -Filter '*uninstall*.exe' -File | Select-Object -First 1
  if (-not $uninstaller) { throw "No NSIS uninstaller found under $installDir" }

  Write-Host "Uninstalling $($uninstaller.FullName) silently"
  Invoke-Installer $uninstaller.FullName @('/S')

  foreach ($key in $keys) {
    if (Test-Path $key) { throw "Uninstall left Native Messaging registry key: $key" }
  }
  if (Test-Path $hostManifest) { throw 'Uninstall left the Native Messaging host manifest' }

  for ($i=0; $i -lt 20 -and (Test-Path $appExe); $i++) { Start-Sleep -Milliseconds 500 }
  if (Test-Path $appExe) { throw "Uninstall left the application EXE: $appExe" }
  $uninstalled = $true
  Write-Host 'Windows installer smoke test passed: install, resources, registry, Native Messaging and uninstall.'
}
finally {
  if (-not $uninstalled) {
    Write-Warning 'Installer test did not finish; a disposable runner may still have installed files.'
  }
}
