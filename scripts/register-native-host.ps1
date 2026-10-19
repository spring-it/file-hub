param([Parameter(Mandatory=$true)][string]$InstallDir,[switch]$Uninstall)
$ErrorActionPreference='Stop'
$HostName='com.springit.filehub'
$ManifestPath=Join-Path $env:LOCALAPPDATA 'FileHub\com.springit.filehub.json'
$Keys=@('HKCU:\Software\Google\Chrome\NativeMessagingHosts\com.springit.filehub','HKCU:\Software\Microsoft\Edge\NativeMessagingHosts\com.springit.filehub')
if($Uninstall){foreach($key in $Keys){Remove-Item -Path $key -Recurse -Force -ErrorAction SilentlyContinue};Remove-Item $ManifestPath -Force -ErrorAction SilentlyContinue;exit 0}
$Exe=Join-Path $InstallDir 'FileHub.exe';if(!(Test-Path $Exe)){throw "FileHub.exe not found: $Exe"}
New-Item -ItemType Directory -Path (Split-Path $ManifestPath) -Force|Out-Null
$Manifest=@{name=$HostName;description='File Hub browser download bridge';path=$Exe;type='stdio';args=@('--native-host');allowed_origins=@('chrome-extension://ifofkigafdeojcgajpdpdheimllpkjml/')}
[IO.File]::WriteAllText($ManifestPath,($Manifest|ConvertTo-Json -Depth 4),(New-Object Text.UTF8Encoding($false)))
foreach($key in $Keys){New-Item -Path $key -Force|Out-Null;Set-Item -Path $key -Value $ManifestPath}
