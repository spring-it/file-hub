$ErrorActionPreference = 'Stop'
$exe = Join-Path $PSScriptRoot '..\agent\publish\FileHub.EtwAgent.exe'
if (-not (Test-Path $exe)) { throw "ETW agent was not published: $exe" }
& $exe --self-test
if ($LASTEXITCODE -ne 0) { throw "ETW agent self-test failed with exit code $LASTEXITCODE" }
